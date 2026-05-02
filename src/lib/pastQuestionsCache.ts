// Offline cache for past questions using IndexedDB (idb-keyval).
// Strategy: cache-first per (exam, subjects, types) bundle, then refresh in background.
import { get, set, keys, del } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

export interface CachedQuestion {
  id: string;
  exam_type: string;
  subject: string;
  year: string | null;
  question_text: string;
  options: { label: string; text: string }[];
  correct_answer: string | null;
  explanation: string | null;
  question_type: string;
}

interface Bundle {
  fetchedAt: number;
  questions: CachedQuestion[];
}

const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function bundleKey(exam: string, subjects: string[], types: string[]) {
  return `pq:${exam}:${[...subjects].sort().join(",")}:${[...types].sort().join(",")}`;
}

export async function loadCachedBundle(
  exam: string,
  subjects: string[],
  types: string[],
): Promise<CachedQuestion[] | null> {
  const key = bundleKey(exam, subjects, types);
  const data = (await get(key)) as Bundle | undefined;
  if (!data) return null;
  return data.questions;
}

export async function fetchAndCache(
  exam: string,
  subjects: string[],
  types: string[],
  limit = 200,
): Promise<CachedQuestion[]> {
  let q = supabase
    .from("past_questions" as any)
    .select("id,exam_type,subject,year,question_text,options,correct_answer,explanation,question_type")
    .eq("exam_type", exam.toLowerCase())
    .in("subject", subjects.map((s) => s.toLowerCase()))
    .in("question_type", types)
    .limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  const questions = ((data as any) || []) as CachedQuestion[];
  await set(bundleKey(exam, subjects, types), {
    fetchedAt: Date.now(),
    questions,
  } satisfies Bundle);
  return questions;
}

/** Reads the super-admin controlled `past_questions_source.useSupabaseData` flag */
export async function shouldUseSupabaseSource(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("app_settings" as any)
      .select("value")
      .eq("key", "past_questions_source")
      .maybeSingle();
    if (error || !data) return false;
    return Boolean((data as any)?.value?.useSupabaseData);
  } catch {
    return false;
  }
}

/** Live fetch via proxy edge function (token stays server-side). */
export async function fetchFromApiProxy(
  exam: string,
  subjects: string[],
  types: string[],
): Promise<CachedQuestion[]> {
  const { data, error } = await supabase.functions.invoke("fetch-past-questions", {
    body: { exam, subjects, types },
  });
  if (error) throw error;
  const raw = (data as any)?.questions || [];
  // Map to CachedQuestion shape (proxy returns rows without id; fabricate stable id from content)
  const mapped: CachedQuestion[] = raw.map((q: any, i: number) => ({
    id: q.external_id || `${q.exam_type}|${q.subject}|${q.year}|${i}|${q.question_text?.slice(0, 32)}`,
    exam_type: q.exam_type,
    subject: q.subject,
    year: q.year ?? null,
    question_text: q.question_text,
    options: q.options || [],
    correct_answer: q.correct_answer ?? null,
    explanation: q.explanation ?? null,
    question_type: q.question_type || "objective",
  }));
  await set(bundleKey(exam, subjects, types), {
    fetchedAt: Date.now(),
    questions: mapped,
  } satisfies Bundle);
  return mapped;
}

export async function getQuestionsWithOfflineFallback(
  exam: string,
  subjects: string[],
  types: string[],
): Promise<{ questions: CachedQuestion[]; fromCache: boolean }> {
  // Hybrid: when SA has flipped the flag, read from Supabase. Otherwise call live API proxy.
  if (navigator.onLine) {
    try {
      const useSupabase = await shouldUseSupabaseSource();
      if (useSupabase) {
        const fresh = await fetchAndCache(exam, subjects, types);
        if (fresh.length) return { questions: fresh, fromCache: false };
        // Fallback to live API if Supabase has nothing yet
        const live = await fetchFromApiProxy(exam, subjects, types);
        return { questions: live, fromCache: false };
      } else {
        const live = await fetchFromApiProxy(exam, subjects, types);
        if (live.length) return { questions: live, fromCache: false };
        // Fallback to Supabase if API returned nothing
        const fresh = await fetchAndCache(exam, subjects, types);
        return { questions: fresh, fromCache: false };
      }
    } catch {
      // fall through to cache
    }
  }
  const cached = await loadCachedBundle(exam, subjects, types);
  return { questions: cached || [], fromCache: true };
}

export async function pruneStaleBundles() {
  const allKeys = await keys();
  for (const k of allKeys) {
    if (typeof k !== "string" || !k.startsWith("pq:")) continue;
    const data = (await get(k)) as Bundle | undefined;
    if (data && Date.now() - data.fetchedAt > TTL_MS) await del(k);
  }
}
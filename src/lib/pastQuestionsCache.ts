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

export async function getQuestionsWithOfflineFallback(
  exam: string,
  subjects: string[],
  types: string[],
): Promise<{ questions: CachedQuestion[]; fromCache: boolean }> {
  // Try network first if online; fall back to cache
  if (navigator.onLine) {
    try {
      const fresh = await fetchAndCache(exam, subjects, types);
      if (fresh.length) return { questions: fresh, fromCache: false };
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
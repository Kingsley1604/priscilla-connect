// Background bulk import of past questions from ALOC API.
// Iterates all exam/subject combos and upserts into past_questions.
// Designed to be called by a scheduled cron job.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALOC_BASE = "https://questions.aloc.com.ng/api/v2";

const EXAMS = ["waec", "neco", "jamb"];
const SUBJECTS = [
  "english", "mathematics", "biology", "chemistry", "physics",
  "economics", "government", "literature", "geography", "commerce",
  "accounting", "agriculture", "civic-education", "crk", "irk", "history",
];

const PER_COMBO = 60;   // questions to fetch per (exam, subject) per run
const BATCH_SIZE = 20;  // ALOC max per request

async function fetchBatch(exam: string, subject: string, batch: number, token: string, mode: "objective" | "theory" = "objective") {
  // ALOC: /m = multiple objective, /t = theory
  const path = mode === "theory" ? "t" : "m";
  const url = `${ALOC_BASE}/${path}?subject=${encodeURIComponent(subject)}&type=${encodeURIComponent(exam)}&total=${batch}`;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          AccessToken: token,
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      const json = await res.json();
      return json?.data ?? [];
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error(`Fetch failed: ${String(lastErr)}`);
}

function normalize(raw: any, exam: string, subject: string, qType: string) {
  const opts = raw?.option ?? raw?.options ?? {};
  const optionList = Array.isArray(opts)
    ? opts.map((t: string, i: number) => ({
        label: ["a", "b", "c", "d", "e"][i] ?? String(i),
        text: String(t ?? ""),
      }))
    : Object.entries(opts).map(([k, v]) => ({
        label: String(k).toLowerCase(),
        text: String(v ?? ""),
      }));
  return {
    external_id: raw?.id ? String(raw.id) : null,
    exam_type: exam.toLowerCase(),
    subject: subject.toLowerCase(),
    year: raw?.examYear ? String(raw.examYear) : null,
    question_text: String(raw?.question ?? "").trim(),
    options: optionList,
    correct_answer: raw?.answer ? String(raw.answer).toLowerCase() : null,
    explanation: raw?.solution ? String(raw.solution) : null,
    image_url: raw?.image ?? null,
    section: raw?.section ?? null,
    question_type: qType,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ALOC_TOKEN = Deno.env.get("ALOC_API_TOKEN");
    if (!ALOC_TOKEN) throw new Error("ALOC_API_TOKEN not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    let totalFetched = 0;
    let totalInserted = 0;
    const errors: string[] = [];

    for (const exam of EXAMS) {
      for (const subject of SUBJECTS) {
        // JAMB = objective only. WAEC/NECO = objective + theory
        const modes: ("objective" | "theory")[] =
          exam === "jamb" ? ["objective"] : ["objective", "theory"];
        try {
          const seen = new Set<string>();
          const collected: any[] = [];
          for (const mode of modes) {
            const rounds = Math.ceil(PER_COMBO / BATCH_SIZE);
            for (let i = 0; i < rounds; i++) {
              const data = await fetchBatch(exam, subject, BATCH_SIZE, ALOC_TOKEN, mode);
              if (!Array.isArray(data) || data.length === 0) break;
              for (const r of data) {
                const n = normalize(r, exam, subject, mode);
                if (!n.question_text) continue;
                const key = `${n.exam_type}|${n.subject}|${n.year}|${n.question_text}`;
                if (seen.has(key)) continue;
                seen.add(key);
                collected.push(n);
              }
              await new Promise((r) => setTimeout(r, 200));
            }
          }
          totalFetched += collected.length;
          if (collected.length) {
            const { error, count } = await admin
              .from("past_questions")
              .upsert(collected, {
                onConflict: "exam_type,subject,year,question_text",
                ignoreDuplicates: true,
                count: "exact",
              });
            if (error) throw error;
            totalInserted += count ?? collected.length;
          }
        } catch (e) {
          errors.push(`${exam}/${subject}: ${(e as Error).message}`);
        }
      }
    }

    await admin.from("past_questions_import_jobs").insert({
      exam_type: "all",
      subject: "all",
      status: errors.length ? "partial" : "success",
      fetched_count: totalFetched,
      inserted_count: totalInserted,
      error_message: errors.length ? errors.join("; ").slice(0, 2000) : null,
      finished_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        fetched: totalFetched,
        inserted: totalInserted,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
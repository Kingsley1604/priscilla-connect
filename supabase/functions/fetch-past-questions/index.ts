// Live proxy to ALOC past-questions API. Keeps the API token server-side.
// Returns normalized questions and triggers a background sync into Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALOC_BASE = "https://questions.aloc.com.ng/api/v2";
const BATCH = 20;

async function fetchAloc(exam: string, subject: string, mode: "m" | "t", token: string) {
  const url = `${ALOC_BASE}/${mode}?subject=${encodeURIComponent(subject)}&type=${encodeURIComponent(exam)}&total=${BATCH}`;
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
      if (!res.ok) { lastErr = `HTTP ${res.status}`; await new Promise(r => setTimeout(r, 400 * (attempt + 1))); continue; }
      const json = await res.json();
      return json?.data ?? [];
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw new Error(`ALOC fetch failed (${exam}/${subject}/${mode}): ${String(lastErr)}`);
}

function normalize(raw: any, exam: string, subject: string, qType: string) {
  const opts = raw?.option ?? raw?.options ?? {};
  const optionList = Array.isArray(opts)
    ? opts.map((t: string, i: number) => ({ label: ["a","b","c","d","e"][i] ?? String(i), text: String(t ?? "") }))
    : Object.entries(opts).map(([k, v]) => ({ label: String(k).toLowerCase(), text: String(v ?? "") }));
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
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const TOKEN = Deno.env.get("ALOC_API_TOKEN");
    if (!TOKEN) throw new Error("ALOC_API_TOKEN missing");

    // Auth check
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const body = await req.json().catch(() => ({}));
    const exam = String(body?.exam || "").toLowerCase();
    const subjects: string[] = Array.isArray(body?.subjects) ? body.subjects.map((s: string) => s.toLowerCase()) : [];
    const types: string[] = Array.isArray(body?.types) && body.types.length ? body.types : ["objective"];
    if (!exam || !subjects.length) {
      return new Response(JSON.stringify({ error: "exam and subjects required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Fetch all subjects in parallel (objective always; theory if requested for waec/neco)
    const all: any[] = [];
    await Promise.all(subjects.map(async (subject) => {
      for (const t of types) {
        if (t === "theory" && exam === "jamb") continue;
        const mode = t === "theory" ? "t" : "m";
        try {
          const raw = await fetchAloc(exam, subject, mode as "m" | "t", TOKEN);
          for (const r of raw) {
            const n = normalize(r, exam, subject, t);
            if (n.question_text) all.push(n);
          }
        } catch (e) {
          console.error("aloc fetch error", e);
        }
      }
    }));

    // Background upsert into Supabase (don't block response)
    const upsertPayload = all.map(({ ...q }) => q);
    const bgSync = async () => {
      if (!upsertPayload.length) return;
      const { error } = await admin.from("past_questions").upsert(upsertPayload, {
        onConflict: "exam_type,subject,year,question_text",
        ignoreDuplicates: true,
      });
      if (error) console.error("bg sync upsert error", error);
    };
    // @ts-ignore EdgeRuntime is provided by Deno Deploy
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(bgSync());
    } else {
      bgSync();
    }

    return new Response(JSON.stringify({ questions: all, count: all.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

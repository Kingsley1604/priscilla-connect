// Bulk import past questions from ALOC Nigeria Past Questions API.
// Admin-only. Manual JWT verification + role check.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALOC_BASE = "https://questions.aloc.com.ng/api/v2";

interface ImportRequest {
  exam: string;        // waec | jamb | neco | post-utme
  subject: string;     // english, mathematics, biology...
  total?: number;      // total questions to fetch (default 200)
  batchSize?: number;  // questions per request (default 20, max 40)
}

async function fetchBatch(exam: string, subject: string, batch: number, token: string) {
  const url = `${ALOC_BASE}/m?subject=${encodeURIComponent(
    subject,
  )}&type=${encodeURIComponent(exam)}&total=${batch}`;
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

function normalize(raw: any, exam: string, subject: string) {
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
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const ALOC_TOKEN = Deno.env.get("ALOC_API_TOKEN");
    if (!ALOC_TOKEN) throw new Error("ALOC_API_TOKEN not configured");

    // Verify caller
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: uerr } = await userClient.auth.getUser();
    if (uerr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ImportRequest;
    const exam = (body.exam || "").trim();
    const subject = (body.subject || "").trim();
    const total = Math.min(Math.max(body.total ?? 200, 1), 2000);
    const batchSize = Math.min(Math.max(body.batchSize ?? 20, 1), 40);

    if (!exam || !subject) {
      return new Response(JSON.stringify({ error: "exam and subject required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job } = await admin
      .from("past_questions_import_jobs")
      .insert({
        triggered_by: userId,
        exam_type: exam.toLowerCase(),
        subject: subject.toLowerCase(),
        status: "running",
      })
      .select("id")
      .single();

    let fetched = 0;
    let inserted = 0;
    const seen = new Set<string>();
    let errorMessage: string | null = null;

    try {
      const rounds = Math.ceil(total / batchSize);
      for (let i = 0; i < rounds; i++) {
        const data = await fetchBatch(exam, subject, batchSize, ALOC_TOKEN);
        if (!Array.isArray(data) || data.length === 0) break;
        const normalized = data
          .map((r) => normalize(r, exam, subject))
          .filter((q) => {
            if (!q.question_text) return false;
            const key = `${q.exam_type}|${q.subject}|${q.year}|${q.question_text}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        fetched += normalized.length;
        if (normalized.length) {
          const { error: insErr, count } = await admin
            .from("past_questions")
            .upsert(normalized, {
              onConflict: "exam_type,subject,year,question_text",
              ignoreDuplicates: true,
              count: "exact",
            });
          if (insErr) throw insErr;
          inserted += count ?? normalized.length;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (e) {
      errorMessage = (e as Error).message;
    }

    await admin
      .from("past_questions_import_jobs")
      .update({
        status: errorMessage ? "failed" : "success",
        fetched_count: fetched,
        inserted_count: inserted,
        error_message: errorMessage,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return new Response(
      JSON.stringify({
        success: !errorMessage,
        fetched,
        inserted,
        error: errorMessage,
        jobId: job?.id,
      }),
      {
        status: errorMessage ? 500 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

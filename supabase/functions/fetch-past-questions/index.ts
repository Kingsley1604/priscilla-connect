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

    // Auth check (manual, since verify_jwt = false)
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }
    const userId = userData.user.id;

    // Backend access check: secondary students or super admins.
    // IMPORTANT: must mirror the frontend normalizer in src/lib/examPrepEligibility.ts
    // so that signup sector values and legacy class-grade variants are accepted.
    const adminCheckClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await adminCheckClient
      .from("profiles")
      .select("is_super_admin, sector, class_grade")
      .eq("id", userId)
      .maybeSingle();
    const { data: roleRow } = await adminCheckClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const norm = (v: unknown) =>
      String(v || "").toLowerCase().replace(/[\s_\-./]+/g, "");
    const SECONDARY_GRADE_TOKENS = new Set([
      "jss1","jss2","jss3",
      "juniorsecondary1","juniorsecondary2","juniorsecondary3",
      "junior1","junior2","junior3",
      "ss1","ss2","ss3","sss1","sss2","sss3",
      "seniorsecondary1","seniorsecondary2","seniorsecondary3",
      "senior1","senior2","senior3",
      "secondary","juniorsecondary","seniorsecondary",
    ]);
    const SECONDARY_SECTOR_TOKENS = [
      "secondary","junior","juniorsecondary","jss","senior","seniorsecondary","sss","seniorsecondary",
    ];

    const sectorN = norm((profile as any)?.sector);
    const gradeN = norm((profile as any)?.class_grade);
    const isSA = Boolean((profile as any)?.is_super_admin);

    const isSecondaryGrade =
      SECONDARY_GRADE_TOKENS.has(gradeN) ||
      /^(jss|juniorsecondary|junior|sss?|seniorsecondary|senior)[123]/.test(gradeN);
    const isSecondarySector =
      SECONDARY_SECTOR_TOKENS.some((t) => sectorN === t || sectorN.startsWith(t));

    // New secondary signups may not have a class assigned yet, so sector alone is enough.
    const isEligibleStudent = (roleRow as any)?.role === "student" && (isSecondarySector || isSecondaryGrade);

    if (!isSA && !isEligibleStudent) {
      console.log("[fetch-past-questions] Access denied", {
        userId, role: (roleRow as any)?.role, sector: (profile as any)?.sector, class_grade: (profile as any)?.class_grade,
        sectorN, gradeN, isSecondaryGrade, isSecondarySector,
      });
      return new Response(JSON.stringify({ error: "Access restricted to secondary students only." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const exam = String(body?.exam || "").toLowerCase();
    const subjects: string[] = Array.isArray(body?.subjects) ? body.subjects.map((s: string) => s.toLowerCase()) : [];
    const types: string[] = Array.isArray(body?.types) && body.types.length ? body.types : ["objective"];
    if (!exam || !subjects.length) {
      return new Response(JSON.stringify({ error: "exam and subjects required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Helper: log a failure (non-blocking) so the SA panel can surface it
    async function logFailure(message: string, details: unknown) {
      try {
        // Look up student name for context
        const { data: prof } = await admin
          .from("profiles")
          .select("full_name, first_name, last_name")
          .eq("id", userId)
          .maybeSingle();
        const studentName =
          (prof as any)?.full_name ||
          [(prof as any)?.first_name, (prof as any)?.last_name].filter(Boolean).join(" ") ||
          null;
        await admin.from("import_failures").insert({
          error_message: message.slice(0, 500),
          error_details: typeof details === "string" ? details.slice(0, 4000) : JSON.stringify(details).slice(0, 4000),
          exam_type: exam,
          subjects,
          student_id: userId,
          student_name: studentName,
        });
        // Real-time SA notifications
        const { data: sas } = await admin
          .from("profiles")
          .select("id")
          .eq("is_super_admin", true);
        const rows = (sas || []).map((r: any) => ({
          target_admin_id: r.id,
          title: "Background import failed",
          message: "Background import failed. Click here for details.",
          type: "system_failure",
        }));
        if (rows.length) await admin.from("admin_notifications").insert(rows);
      } catch (e) {
        console.error("logFailure error", e);
      }
    }

    // Fetch all subjects in parallel (objective always; theory if requested for waec/neco)
    const all: any[] = [];
    const fetchErrors: string[] = [];
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
          const msg = (e as Error).message;
          fetchErrors.push(`${subject}/${t}: ${msg}`);
          console.error("aloc fetch error", e);
        }
      }
    }));

    if (!all.length) {
      await logFailure("No questions returned from ALOC", fetchErrors.join("; ") || "Empty response");
    }

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

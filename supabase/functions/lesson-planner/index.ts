import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    console.log("Lesson planner request received");

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", claimsData.claims.sub);

    // Input validation
    const body = await req.json();

    if (!body.subject || typeof body.subject !== 'string' || body.subject.trim().length < 2 || body.subject.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Subject is required and must be between 2-100 characters' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.grade || typeof body.grade !== 'string' || body.grade.trim().length < 2 || body.grade.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Grade is required and must be between 2-50 characters' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length < 5 || body.topic.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Topic is required and must be between 5-200 characters' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.duration || typeof body.duration !== 'number' || body.duration < 10 || body.duration > 300) {
      return new Response(
        JSON.stringify({ error: 'Duration must be a number between 10-300 minutes' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.objectives || typeof body.objectives !== 'string' || body.objectives.trim().length < 10 || body.objectives.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Objectives are required and must be between 10-1000 characters' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, grade, topic, duration, objectives } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert educational AI assistant helping teachers create comprehensive lesson plans for Priscilla School.

Create a detailed, well-structured lesson plan with the following sections:

1. LESSON OVERVIEW
   - Subject and Topic
   - Grade Level
   - Duration
   - Learning Objectives

2. MATERIALS NEEDED
   - List all required materials, books, and resources

3. INTRODUCTION (5-10 mins)
   - Hook/Engagement activity
   - Prior knowledge activation

4. MAIN INSTRUCTION (detailed breakdown with time allocation)
   - Key concepts to teach
   - Teaching methods
   - Examples and demonstrations
   - Student activities

5. GUIDED PRACTICE
   - Activities with teacher support
   - Questions to check understanding

6. INDEPENDENT PRACTICE
   - Individual or group work
   - Application exercises

7. ASSESSMENT
   - How to evaluate student learning
   - Questions to ask
   - Observable outcomes

8. CLOSURE
   - Summary of key points
   - Preview of next lesson

9. DIFFERENTIATION
   - Support for struggling students
   - Extensions for advanced students

10. HOMEWORK/FOLLOW-UP (if applicable)

Format the response in clear markdown with headers and bullet points. Make it practical and ready to use.`;

    const userPrompt = `Create a lesson plan for:
Subject: ${subject}
Grade Level: ${grade}
Topic: ${topic}
Duration: ${duration} minutes
Learning Objectives: ${objectives}

Provide a complete, detailed lesson plan following the structure outlined.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please contact administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const lessonPlan = data.choices?.[0]?.message?.content || "I couldn't generate a lesson plan. Please try again.";

    console.log("Successfully generated lesson plan");

    return new Response(JSON.stringify({ lessonPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Lesson planner error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

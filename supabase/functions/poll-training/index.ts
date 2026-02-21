// supabase/functions/poll-training/index.ts
// Edge Function: Polls fal.ai for training job status and updates DB.
// Verifies JWT auth to ensure user can only poll their own jobs.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TRIGGER_WORD = "ohwx";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Verify JWT
        const authHeader = req.headers.get("authorization") ?? "";
        const token = authHeader.replace("Bearer ", "");
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const url = new URL(req.url);
        const jobId = url.searchParams.get("jobId");

        if (!jobId) {
            return new Response(
                JSON.stringify({ success: false, error: "jobId query param is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch the style record (must belong to user)
        const { data: style, error: fetchError } = await supabase
            .from("styles")
            .select("*")
            .eq("id", jobId)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !style) {
            return new Response(
                JSON.stringify({ success: false, error: "Style record not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Already completed or failed — return cached result
        if (style.status === "completed" || style.status === "failed") {
            return new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        status: style.status,
                        progress: style.progress,
                        logs: (style.logs || []).slice(-5),
                        loraUrl: style.lora_url,
                        triggerWord: style.trigger_word,
                        errorMessage: style.error_message,
                    },
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // No fal request ID yet — still uploading
        if (!style.fal_request_id) {
            return new Response(
                JSON.stringify({
                    success: true,
                    data: { status: style.status, progress: style.progress, logs: (style.logs || []).slice(-5) },
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Poll fal.ai queue status
        const statusRes = await fetch(
            `https://queue.fal.run/fal-ai/flux-2-trainer/requests/${style.fal_request_id}/status?logs=true`,
            { headers: { Authorization: `Key ${FAL_KEY}` } }
        );

        if (!statusRes.ok) throw new Error(`fal.ai status check failed: ${statusRes.status}`);

        const statusData = await statusRes.json();
        const currentStatus = statusData.status as string;
        const falLogs: string[] = (statusData.logs || []).map((l: { message: string }) => l.message);
        const allLogs = [...(style.logs || []), ...falLogs];

        if (currentStatus === "COMPLETED") {
            const resultRes = await fetch(
                `https://queue.fal.run/fal-ai/flux-2-trainer/requests/${style.fal_request_id}`,
                { headers: { Authorization: `Key ${FAL_KEY}` } }
            );
            const resultData = await resultRes.json();
            const loraUrl = resultData?.diffusers_lora_file?.url || "";
            const configUrl = resultData?.config_file?.url || "";

            await supabase.from("styles").update({
                status: "completed", progress: 100,
                lora_url: loraUrl, config_url: configUrl,
                logs: [...allLogs, "Training complete! LoRA weights ready."],
            }).eq("id", jobId);

            return new Response(
                JSON.stringify({
                    success: true,
                    data: { status: "completed", progress: 100, logs: allLogs.slice(-5), loraUrl, triggerWord: TRIGGER_WORD },
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else if (currentStatus === "FAILED") {
            await supabase.from("styles").update({
                status: "failed", progress: 0,
                error_message: "Training failed on fal.ai",
                logs: [...allLogs, "Training failed."],
            }).eq("id", jobId);

            return new Response(
                JSON.stringify({
                    success: true,
                    data: { status: "failed", progress: 0, logs: allLogs.slice(-5), errorMessage: "Training failed on fal.ai" },
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else {
            // IN_QUEUE or IN_PROGRESS
            const newStatus = currentStatus === "IN_QUEUE" ? "pending" : "training";
            const logProgress = Math.min(10 + (allLogs.length * 2), 90);
            const newProgress = Math.max(style.progress || 0, currentStatus === "IN_QUEUE" ? 30 : logProgress);

            await supabase.from("styles").update({
                status: newStatus, progress: newProgress, logs: allLogs,
            }).eq("id", jobId);

            return new Response(
                JSON.stringify({
                    success: true,
                    data: { status: newStatus, progress: newProgress, logs: allLogs.slice(-5) },
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
    } catch (error) {
        console.error("[poll-training] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

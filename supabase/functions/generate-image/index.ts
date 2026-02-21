// supabase/functions/generate-image/index.ts
// Edge Function: Generates images using FLUX.1-dev with optional LoRA styles.
// Verifies JWT auth.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TRIGGER_WORD = "ohwx";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GenerateBody {
    prompt: string;
    primaryStyleId?: string;
    referenceStyleId?: string;
    imageSize: string;
    negativePrompt?: string;
    numImages: number;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!FAL_KEY) throw new Error("FAL_KEY secret is not configured");

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

        const body: GenerateBody = await req.json();
        const { prompt, primaryStyleId, referenceStyleId, imageSize, negativePrompt, numImages } = body;

        if (!prompt) {
            return new Response(
                JSON.stringify({ success: false, error: "prompt is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build LoRA weights from user's styles
        const loras: Array<{ path: string; scale: number }> = [];
        let resolvedPrompt = prompt;

        if (primaryStyleId) {
            const { data: style } = await supabase
                .from("styles")
                .select("lora_url, trigger_word")
                .eq("id", primaryStyleId)
                .eq("user_id", user.id)
                .single();

            if (style?.lora_url) {
                loras.push({ path: style.lora_url, scale: referenceStyleId ? 0.75 : 0.85 });
                if (!resolvedPrompt.includes(TRIGGER_WORD)) {
                    resolvedPrompt = `${TRIGGER_WORD} ${resolvedPrompt}`;
                }
            }
        }

        if (referenceStyleId) {
            const { data: style } = await supabase
                .from("styles")
                .select("lora_url")
                .eq("id", referenceStyleId)
                .eq("user_id", user.id)
                .single();

            if (style?.lora_url) {
                loras.push({ path: style.lora_url, scale: 0.6 });
            }
        }

        const falInput: Record<string, unknown> = {
            model_name: "fal-ai/flux/dev",
            prompt: resolvedPrompt,
            image_size: imageSize || "landscape_4_3",
            num_images: Math.min(numImages || 1, 4),
            output_format: "jpeg",
        };

        if (negativePrompt) falInput.negative_prompt = negativePrompt;
        if (loras.length > 0) falInput.loras = loras;

        console.log(`[generate-image] User: ${user.id}, prompt: "${resolvedPrompt}", ${loras.length} LoRA(s)`);

        const genRes = await fetch("https://fal.run/fal-ai/flux-lora", {
            method: "POST",
            headers: {
                Authorization: `Key ${FAL_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(falInput),
        });

        if (!genRes.ok) {
            const errText = await genRes.text();
            throw new Error(`Generation failed (${genRes.status}): ${errText}`);
        }

        const genData = await genRes.json();
        const images = (genData.images || []).map((img: Record<string, unknown>) => ({
            url: img.url,
            width: img.width,
            height: img.height,
            contentType: img.content_type || "image/jpeg",
        }));

        return new Response(
            JSON.stringify({
                success: true,
                data: { images, resolvedPrompt, seed: genData.seed || 0 },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[generate-image] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

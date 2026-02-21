// supabase/functions/train-style/index.ts
// Edge Function: Accepts images + metadata, uploads thumbnail to Cloudinary,
// compresses images to ZIP for fal.ai, submits training job, creates DB record.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "dfi3xxuv6";
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY") ?? "188628145318632";
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET") ?? "I9-ENS6kHQ4L3pcGn7TiwEkjPDY";
const TRIGGER_WORD = "ohwx";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildCaption(styleType: string): string {
    switch (styleType) {
        case "person": return `a photo of ${TRIGGER_WORD} person`;
        case "art_style": return `artwork in the style of ${TRIGGER_WORD}`;
        case "character": return `a depiction of ${TRIGGER_WORD} character`;
        default: return `a photo of ${TRIGGER_WORD}`;
    }
}

/** Upload a file buffer to Cloudinary using unsigned upload */
async function uploadToCloudinary(
    fileBuffer: ArrayBuffer,
    fileName: string,
    folder: string,
    contentType: string
): Promise<string> {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    const dataUri = `data:${contentType};base64,${base64}`;

    // Generate signature for authenticated upload
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const form = new FormData();
    form.append("file", dataUri);
    form.append("folder", folder);
    form.append("timestamp", timestamp.toString());
    form.append("api_key", CLOUDINARY_API_KEY);
    form.append("signature", signature);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: form }
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const result = await res.json();
    return result.secure_url;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!FAL_KEY) throw new Error("FAL_KEY secret is not configured");

        // Verify JWT to get user_id
        const authHeader = req.headers.get("authorization") ?? "";
        const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Decode the JWT to extract user
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const userId = user.id;
        const formData = await req.formData();
        const styleName = formData.get("styleName") as string;
        const styleType = formData.get("styleType") as string;
        const imageFiles: File[] = [];

        for (const [key, value] of formData.entries()) {
            if (key === "images" && value instanceof File) {
                imageFiles.push(value);
            }
        }

        if (!styleName || !styleType) {
            return new Response(
                JSON.stringify({ success: false, error: "styleName and styleType are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (imageFiles.length < 20) {
            return new Response(
                JSON.stringify({ success: false, error: `At least 20 images required. Got: ${imageFiles.length}` }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`[train-style] User: ${userId}, Style: "${styleName}" (${styleType}), ${imageFiles.length} images`);

        // Service role client for DB writes (bypasses RLS)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Upload thumbnail to Cloudinary (per-user folder)
        const firstImage = imageFiles[0];
        const thumbBuffer = await firstImage.arrayBuffer();
        const cloudinaryFolder = `neongen/${userId}/thumbnails`;
        let thumbnailUrl: string | null = null;

        try {
            thumbnailUrl = await uploadToCloudinary(
                thumbBuffer, firstImage.name, cloudinaryFolder, firstImage.type
            );
            console.log(`[train-style] Thumbnail uploaded: ${thumbnailUrl}`);
        } catch (err) {
            console.error("[train-style] Thumbnail upload failed:", err);
        }

        // Create DB record with user_id
        const { data: style, error: insertError } = await supabase
            .from("styles")
            .insert({
                user_id: userId,
                style_name: styleName,
                style_type: styleType,
                trigger_word: TRIGGER_WORD,
                status: "uploading",
                progress: 10,
                image_count: imageFiles.length,
                thumbnail_url: thumbnailUrl,
                logs: ["Packaging images..."],
            })
            .select()
            .single();

        if (insertError || !style) {
            throw new Error(`DB insert failed: ${insertError?.message}`);
        }

        console.log(`[train-style] DB record: ${style.id}`);

        // Compress images to ZIP for fal.ai
        console.log(`[train-style] Creating ZIP archive...`);
        const { ZipWriter, BlobWriter, BlobReader } = await import("https://deno.land/x/zipjs@v2.7.34/index.js");
        const blobWriter = new BlobWriter("application/zip");
        const zipWriter = new ZipWriter(blobWriter);

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const ext = file.name.split(".").pop() || "jpg";
            const buffer = await file.arrayBuffer();
            await zipWriter.add(`image_${i}.${ext}`, new BlobReader(new Blob([buffer])));
        }

        await zipWriter.close();
        const zipBlob = blobWriter.getData();
        console.log(`[train-style] ZIP ready: ${(zipBlob.size / 1024 / 1024).toFixed(1)} MB`);

        // Upload ZIP to fal.ai storage
        const zipFormData = new FormData();
        zipFormData.append("file", zipBlob, "training_images.zip");

        const falUploadRes = await fetch("https://fal.ai/api/storage/upload", {
            method: "POST",
            headers: { Authorization: `Key ${FAL_KEY}` },
            body: zipFormData,
        });

        if (!falUploadRes.ok) throw new Error(`fal.ai storage upload failed: ${falUploadRes.status}`);
        const falUploadData = await falUploadRes.json();
        const imageDataUrl = falUploadData.url || falUploadData.access_url;
        console.log(`[train-style] ZIP uploaded to fal.ai: ${imageDataUrl}`);

        // Update progress
        await supabase.from("styles").update({
            progress: 25,
            logs: ["Packaging images...", "Uploaded to training servers..."],
        }).eq("id", style.id);

        // Submit training job
        console.log(`[train-style] Submitting to fal-ai/flux-2-trainer...`);
        const defaultCaption = buildCaption(styleType);

        const trainRes = await fetch("https://queue.fal.run/fal-ai/flux-2-trainer", {
            method: "POST",
            headers: {
                Authorization: `Key ${FAL_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                image_data_url: imageDataUrl,
                steps: 1000,
                learning_rate: 0.00005,
                default_caption: defaultCaption,
                output_lora_format: "fal",
            }),
        });

        if (!trainRes.ok) {
            const errText = await trainRes.text();
            throw new Error(`fal.ai training failed (${trainRes.status}): ${errText}`);
        }

        const trainData = await trainRes.json();
        const requestId = trainData.request_id;
        console.log(`[train-style] ✅ Submitted! request_id: ${requestId}`);

        await supabase.from("styles").update({
            status: "training",
            progress: 30,
            fal_request_id: requestId,
            logs: ["Packaging images...", "Uploaded to training servers...", "Training job submitted — waiting for resources..."],
        }).eq("id", style.id);

        return new Response(
            JSON.stringify({ success: true, data: { jobId: style.id, triggerWord: TRIGGER_WORD } }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[train-style] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

import { GoogleGenAI } from "@google/genai";

// Initialize the client
// Note: In a real production app, we should proxy this through a backend to keep the key secret.
// For this demo/preview, we use the client-side key injection.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async generateContent(model: string, prompt: string) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async streamContent(model: string, prompt: string, history: { role: string; parts: { text: string }[] }[]) {
    try {
      const chat = ai.chats.create({
        model: model,
        history: history,
      });

      const result = await chat.sendMessageStream({ message: prompt });
      return result;
    } catch (error) {
      console.error("Gemini API Stream Error:", error);
      throw error;
    }
  },

  async generateImage(model: string, prompt: string, aspectRatio: string = '1:1', referenceImage: string | null = null) {
    try {
      // Note: gemini-2.5-flash-image uses generateContent, not generateImages (which is for Imagen)
      // And it doesn't support responseMimeType or responseSchema
      
      const config: any = {
         imageConfig: {
             aspectRatio: aspectRatio
         }
      };
      
      // For gemini-3-pro-image-preview, we can set imageSize to '1K', '2K', '4K'
      if (model === 'gemini-3-pro-image-preview') {
          config.imageConfig.imageSize = '1K';
      }

      const parts: any[] = [];
      
      // If reference image exists, add it first (multimodal input)
      if (referenceImage) {
          // Extract base64 data (remove data:image/png;base64, prefix)
          const base64Data = referenceImage.split(',')[1];
          const mimeType = referenceImage.split(';')[0].split(':')[1];
          
          parts.push({
              inlineData: {
                  mimeType: mimeType,
                  data: base64Data
              }
          });
          
          // Enhance prompt to explicitly ask for style copy
          parts.push({ 
              text: `${prompt} \n\nIMPORTANT: Analyze the style of the provided reference image (colors, lighting, art style, character design) and generate the new image STRICTLY following that style.` 
          });
      } else {
          parts.push({ text: prompt });
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: parts
        },
        config: config
      });

      // Extract image from response
      // The output response may contain both image and text parts
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
      
      throw new Error("No image generated in response");
    } catch (error) {
      console.error("Gemini Image Gen Error:", error);
      throw error;
    }
  }
,

  async generateVideo(model: string, prompt: string, config: { aspectRatio: string; resolution: string }) {
    try {
      // Check for API key selection for Veo models
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
              await window.aistudio.openSelectKey();
              // Re-check or assume success, but creating a new client instance is recommended
              // For this demo, we'll assume the environment key is sufficient or the user has selected one
          }
      }

      let operation = await ai.models.generateVideos({
        model: model,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: config.resolution as '720p' | '1080p',
          aspectRatio: config.aspectRatio as '16:9' | '9:16'
        }
      });

      return operation;
    } catch (error) {
      console.error("Gemini Video Gen Error:", error);
      throw error;
    }
  },

  async pollVideoOperation(operation: any) {
      try {
        let currentOp = operation;
        while (!currentOp.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
        }
        
        const videoUri = currentOp.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No video URI in response");

        // Fetch the actual video content
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(videoUri, {
            method: 'GET',
            headers: {
                'x-goog-api-key': apiKey || '',
            },
        });

        if (!response.ok) throw new Error("Failed to download video content");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);

      } catch (error) {
          console.error("Video Polling Error:", error);
          throw error;
      }
  },

  async analyzeStyle(images: string[]): Promise<string> {
    try {
      console.log("Starting style analysis with", images.length, "images");
      
      // We'll send a subset of images to Gemini to analyze
      // Limit to 3 images to avoid payload limits and timeouts
      const subset = images.slice(0, 3);
      console.log("Using subset of", subset.length, "images for analysis");
      
      const parts: any[] = [];
      
      for (const img of subset) {
          // Check if image is too large, if so, we might need to resize (omitted for brevity, but good practice)
          // For now, we assume reasonable size or that the user understands the limit
          
          const base64Data = img.split(',')[1];
          const mimeType = img.split(';')[0].split(':')[1];
          parts.push({
              inlineData: {
                  mimeType: mimeType,
                  data: base64Data
              }
          });
      }

      parts.push({
          text: "Analyze these images to create a highly consistent character reference. \n\nCRITICAL INSTRUCTION: Focus EXCLUSIVELY on the person's face and head. Ignore the background, clothing (unless distinct headwear), lighting environment, and artistic style of the surroundings. \n\nExtract the following details with extreme precision:\n1. Facial Structure: Face shape, jawline, cheekbones, chin.\n2. Eyes: Shape, color, eyelash style, eyebrow shape and thickness.\n3. Nose: Shape, bridge, tip.\n4. Mouth: Lip shape, thickness, cupid's bow.\n5. Hair: Color, texture, hairline, exact style.\n6. Skin: Tone, texture, blemishes, freckles, moles.\n\nOutput a system instruction that describes ONLY the character's head and face to ensure perfect consistency in future generations, regardless of the requested setting or style."
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Use the most capable model for analysis
        contents: {
            parts: parts
        }
      });

      return response.text || "Failed to analyze style.";
    } catch (error) {
      console.error("Style Analysis Error:", error);
      throw error;
    }
  }
};
declare global {
    interface Window {
        aistudio?: {
            hasSelectedApiKey: () => Promise<boolean>;
            openSelectKey: () => Promise<void>;
        }
    }
}


import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { GEMINI_MODELS, IMAGEN_MODELS } from "../constants";

export const testApiKey = async () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return false;
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Halo, ini adalah pesan tes untuk memverifikasi API Key.",
    });
    return true;
  } catch (error: any) {
    return false;
  }
};

const getApiKey = () => {
  if (typeof window !== 'undefined') {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && savedKey.trim() !== '') {
        return savedKey.trim();
    }
  }
  
  throw new Error("API Key tidak ditemukan di localStorage. Silakan masukkan kunci Anda di menu API Key.");
};


const withFallback = async <T>(modelList: string[], fn: (model: string, ai: GoogleGenAI) => Promise<T>): Promise<T> => {
  let lastError: any;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key tidak ditemukan. Silakan masukkan API Key Anda di menu API Key.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });

  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    try {
      return await fn(model, ai);
    } catch (error: any) {
      lastError = error;
      console.error(`Error calling model ${model}:`, error);
      
      const errorMsg = (error.message || error.toString()).toLowerCase();
      
      // Check for API Key issues
      if (errorMsg.includes("api key") || errorMsg.includes("invalid")) {
        throw new Error("API Key tidak valid. Pastikan Anda telah memasukkan API Key yang benar di menu API Key.");
      }

      // Check for quota or rate limit errors
      if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit") || errorMsg.includes("exhausted")) {
        console.warn(`Model ${model} limit reached (${i + 1}/${modelList.length}), trying next...`);
        if (i < modelList.length - 1) continue;
        throw new Error("Maaf, limit penggunaan hari ini sudah habis. Gunakan akun Gmail lain, kembali besok, atau gunakan platform lain yang tersedia.");
      }
      throw error;
    }
  }
  return null as any; // Should not reach here
};

export const generateImage = async (prompt: string, images: string[] = [], aspectRatio: string = "1:1", modelType: 'gemini' | 'imagen' = 'gemini') => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });

  if (modelType === 'imagen') {
    const response = await ai.models.generateImages({
      model: IMAGEN_MODELS[0],
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });
    const base64EncodeString: string = response.generatedImages[0].image.imageBytes;
    return [`data:image/jpeg;base64,${base64EncodeString}`];
  }

  const parts: any[] = [{ text: prompt }];

  images.forEach(img => {
    const mimeType = img.split(';')[0].split(':')[1] || "image/png";
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: img.split(',')[1]
      }
    });
  });

  const response = await withFallback(GEMINI_MODELS.IMAGE, (model, aiInstance) => 
    aiInstance.models.generateContent({
      model: model,
      contents: [{ parts }],
      config: {
        imageConfig: { aspectRatio } as any,
        systemInstruction: `You are a world-class AI image generator specializing in "Identity Lock" and "Subject Preservation". 
        Your ABSOLUTE PRIORITY is to maintain the EXACT facial features, identity, and body proportions of the subjects provided in the reference images.
        
        CRITICAL RULES:
        1. DO NOT generate new faces. The face in the output MUST be a pixel-perfect or high-fidelity representation of the person in the source image.
        2. MAINTAIN BODY PROPORTIONS: If the source image shows a full body or specific proportions, you MUST preserve them. Do not alter the subject's build or height unless explicitly requested.
        3. SEAMLESS INTEGRATION: Blend the preserved subject into the new environment/style while keeping their identity 100% recognizable.
        4. ZERO HALLUCINATION: Do not add features or change the subject's core appearance.
        
        If multiple images are provided, merge the subjects while keeping each individual's identity intact.`
      }
    })
  );

  const imageParts = response.candidates?.[0]?.content?.parts?.filter(p => p.inlineData);
  return imageParts?.map(p => `data:image/png;base64,${p.inlineData?.data}`) || [];
};

export const analyzeImage = async (prompt: string, images: string[]) => {
  const parts: any[] = [{ text: prompt }];

  images.forEach(img => {
    const mimeType = img.split(';')[0].split(':')[1] || "image/png";
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: img.split(',')[1]
      }
    });
  });

  const response = await withFallback(GEMINI_MODELS.TEXT, (model, aiInstance) =>
    aiInstance.models.generateContent({
      model: model,
      contents: [{ parts }],
      config: {
        systemInstruction: "You are an expert AI prompter and image analyst. Your goal is to provide highly accurate, creative, and detailed descriptions or prompts based on visual input. Always follow the user's specific formatting requirements."
      }
    })
  );
  return response.text;
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore', style?: string) => {
  let promptText = text;
  if (style && style !== 'Natural') {
    promptText = `Say ${style}: ${text}`;
  }

  const response = await withFallback(GEMINI_MODELS.TTS, (model, aiInstance) =>
    aiInstance.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ["AUDIO"] as any,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    })
  );
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateVideo = async (prompt: string, image?: string, aspectRatio: string = '16:9') => {
  // Ensure aspect ratio is valid for Veo (16:9 or 9:16)
  const validRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
  
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: validRatio
  };

  return await withFallback(GEMINI_MODELS.VIDEO, async (model, aiInstance) => {
    let operation;

    if (image) {
      const mimeType = image.split(';')[0].split(':')[1] || "image/png";
      const imageBytes = image.split(',')[1];
      
      operation = await aiInstance.models.generateVideos({
        model: model,
        prompt: prompt,
        image: {
          imageBytes: imageBytes,
          mimeType: mimeType
        },
        config: config
      });
    } else {
      operation = await aiInstance.models.generateVideos({
        model: model,
        prompt: prompt,
        config: config
      });
    }

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await aiInstance.operations.getVideosOperation({ operation: operation });
    }

    return operation.response?.generatedVideos?.[0]?.video?.uri;
  });
};

export const chatWithAI = async (history: { role: string, parts: { text: string }[] }[], systemInstruction: string) => {
  const response = await withFallback(GEMINI_MODELS.TEXT, (model, aiInstance) =>
    aiInstance.models.generateContent({
      model: model,
      contents: history,
      config: {
        systemInstruction: systemInstruction
      }
    })
  );
  return response.text;
};

export const generateText = async (prompt: string, systemInstruction: string) => {
  const response = await withFallback(GEMINI_MODELS.TEXT, (model, aiInstance) =>
    aiInstance.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction
      }
    })
  );
  return response.text;
};


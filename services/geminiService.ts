import { GoogleGenAI } from '@google/genai';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generatePromptsFromAudio = async (files: File[], apiKey: string): Promise<string[]> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = new window.GoogleGenAI({ apiKey });

  const promptForSingleAudio = `You are an expert video script director. Your task is to analyze the provided audio file and generate a single, concise, visually descriptive prompt in VIETNAMESE for a video generation model like VEO. The prompt should capture the essence, mood, and key information of the entire audio file. The prompt MUST be in VIETNAMESE.

  **CRITICAL INSTRUCTIONS:**
  1.  **Analyze Audio:** Listen carefully to the entire audio content.
  2.  **Summarize Visually:** Create ONE single VIETNAMESE prompt that summarizes the audio content visually. It should be suitable for generating an 8-second video clip that represents the audio.
  3.  **Output Format (Strict):**
      *   Return ONLY the generated prompt text in VIETNAMESE.
      *   Do not include any other text, explanations, headers, or introductory/concluding remarks. Just the prompt itself.
  `;
  
  const generationPromises = files.map(async (file) => {
      const audioPart = await fileToGenerativePart(file);
      const contents = {
          parts: [
              { text: promptForSingleAudio },
              audioPart
          ]
      };
      
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents,
          });
          return response.text.trim();
      } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          if (error instanceof Error && error.message.includes('API key not valid')) {
              // Re-throw to be caught by Promise.all and fail fast
              throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt.');
          }
          // Return an error message for the specific file that failed
          return `Lỗi khi tạo prompt cho file: ${file.name}. Vui lòng thử lại.`;
      }
  });

  // Promise.all will run requests in parallel and reject if any of them reject (e.g., API key error)
  try {
    const prompts = await Promise.all(generationPromises);
    return prompts;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Propagate the specific error (like the API key error)
    throw error;
  }
};
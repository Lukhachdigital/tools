
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
  
  const prompts: string[] = [];

  // Execute sequentially to avoid Rate Limit 429 errors
  for (const file of files) {
      const audioPart = await fileToGenerativePart(file);
      const contents = {
          parts: [
              { text: promptForSingleAudio },
              audioPart
          ]
      };
      
      try {
          // Add delay to respect rate limits (4s for Gemini Free Tier)
          await new Promise(resolve => setTimeout(resolve, 4000));

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents,
          });
          prompts.push(response.text.trim());
      } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          let errorMessage = `Lỗi khi tạo prompt cho file: ${file.name}.`;
          
          if (error instanceof Error) {
             if (error.message.includes('API key not valid')) {
                 throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt.');
             }
             if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
                 throw new Error('Hệ thống đang bận, vui lòng thử lại sau giây lát (Lỗi 429/Quota).');
             }
             errorMessage += ` Chi tiết: ${error.message}`;
          }
          // Push error message as result so user knows which file failed, or throw to stop all
          prompts.push(errorMessage);
      }
  }

  return prompts;
};

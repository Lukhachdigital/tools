import { GoogleGenAI } from '@google/genai';

// Add type definitions for the global window object to satisfy TypeScript.
declare global {
    interface Window {
        GoogleGenAI: typeof GoogleGenAI;
    }
}

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

export const generatePromptsFromAudio = async (files: File[], apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = new window.GoogleGenAI({ apiKey });

  const prompt = `You are an expert video script director. Your task is to analyze the provided audio file(s) and generate a series of 8-second video prompts that visually represent the content of the audio.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze Audio:** Listen carefully to the entire audio content provided.
2.  **Segment into 8-Second Chunks:** Mentally divide the audio into logical 8-second segments.
3.  **Create Prompts:** For each segment, create a concise, visually descriptive prompt for a video generation model like VEO. The prompt should capture the essence, mood, and key information of that 8-second audio chunk. The prompts MUST be in ENGLISH.
4.  **Formatting (Strict):**
    *   Each prompt must be preceded by a header that indicates the time segment. The header must be in the format: \`**Prompt for [Start Time]s - [End Time]s**\`. For example: \`**Prompt for 0s - 8s**\`, \`**Prompt for 8s - 16s**\`, etc.
    *   Separate each complete entry (header + prompt) with two newlines (\`\n\n\`).
    *   Do not include any other text, explanations, or introductory/concluding remarks. Only output the list of prompts in the specified format.

Example Output Format:
**Prompt for 0s - 8s**
A scientist in a modern laboratory adjusts a glowing blue liquid in a beaker, with complex scientific equipment in the background.

**Prompt for 8s - 16s**
A close-up shot of the blue liquid bubbling vigorously as the scientist watches with a look of intense concentration.
`;

  const audioParts = await Promise.all(files.map(fileToGenerativePart));
  
  const contents = {
      parts: [
          { text: prompt },
          ...audioParts
      ]
  };

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt.');
    }
    throw new Error('Đã xảy ra lỗi khi giao tiếp với AI. Vui lòng thử lại.');
  }
};



import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================

export type ArticleLength = 'short' | 'long';

export interface GeneratedContent {
  title: string;
  article: string;
  engagementCall: string;
}

type UploadedImage = {
  id: string;
  base64: string;
  mimeType: string;
  dataUrl: string;
};

const CATEGORIES = [
  "Tình yêu",
  "Hôn nhân",
  "Xã hội",
  "Giáo dục",
  "Kinh doanh",
  "Phật pháp",
  "Gia đình",
  "Phát triển bản thân",
  "Đàn ông",
  "Phụ nữ"
];

// ==========================================
// 2. AUDIO HELPER FUNCTIONS
// ==========================================

// Processes raw PCM bytes from Gemini TTS into a playable AudioBuffer.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Gemini TTS returns 16-bit PCM, so we need an Int16Array view.
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; // Normalize to [-1.0, 1.0]
    }
  }
  return buffer;
}

// Converts an AudioBuffer into a Blob with a proper WAV header.
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels: Float32Array[] = [];
  let i: number, sample: number;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // chunk size
  setUint16(1); // audio format 1 (PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([view], { type: 'audio/wav' });
};


// ==========================================
// 3. SUB-COMPONENTS
// ==========================================

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CopyButton: React.FC<{ textToCopy: string; label?: string; className?: string }> = ({ textToCopy, label, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
        copied
          ? 'bg-green-600 text-white'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      } ${className || ''}`}
    >
      {label ? (copied ? 'Đã sao chép' : label) : (copied ? 'Đã sao chép' : 'Chép')}
    </button>
  );
};

const Lightbox = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => {
  if (!imageUrl) return null;

  const handleSave = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `podcast-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt="Enlarged result" 
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl mb-4" 
        />
        <div className="flex gap-4">
           <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải ảnh về
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors shadow-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const ImageUploader = ({ uploadedImage, setUploadedImage, disabled, label }: { uploadedImage: UploadedImage | null, setUploadedImage: (img: UploadedImage | null) => void, disabled: boolean, label: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setUploadedImage({
              id: `${file.name}-${Date.now()}`,
              base64: reader.result.split(',')[1],
              dataUrl: reader.result,
              mimeType: file.type,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    
    return (
        <div className="flex flex-col items-center w-full">
          {label && (
            <label className="block text-sm font-medium text-gray-300 mb-2 text-center w-full truncate" title={label}>
                {label}
            </label>
          )}
          <div 
            className={`w-full aspect-square bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center transition relative group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-700 hover:border-slate-500'}`}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/png, image/jpeg, image/webp"
              disabled={disabled}
            />
            {uploadedImage ? (
              <React.Fragment>
                <img src={uploadedImage.dataUrl} alt="Uploaded preview" className="w-full h-full object-cover rounded-lg" />
                <button
                    onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                    className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    disabled={disabled}
                    title="Xóa ảnh"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
              </React.Fragment>
            ) : (
              <div className="text-center text-gray-400 p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">Tải ảnh lên</p>
              </div>
            )}
          </div>
        </div>
    );
};

// ==========================================
// 4. AI SERVICES (LOGIC)
// ==========================================

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Tiêu đề của bài viết, là chủ đề do người dùng cung cấp với mỗi chữ cái đầu của từ được viết hoa."
    },
    article: {
      type: Type.STRING,
      description: "Nội dung chính của bài viết, không bao gồm tiêu đề hay lời kêu gọi. Độ dài phải tuân thủ nghiêm ngặt theo yêu cầu."
    },
    engagementCall: {
        type: Type.STRING,
        description: "Lời cảm nghĩ ngắn gọn và lời kêu gọi tương tác (like, share, comment) để đặt ở cuối bài viết."
    },
  },
  required: ["title", "article", "engagementCall"],
};

const getSystemInstruction = (length: ArticleLength, seed: number, category: string) => {
    const lengthInstruction = length === 'short'
    ? 'TUYỆT ĐỐI QUAN TRỌNG: Tổng độ dài của bài viết (article) PHẢI nằm trong khoảng 1200 đến 1800 ký tự (khoảng 240-360 từ). Hãy viết nội dung cô đọng, súc tích, tập trung vào các ý chính quan trọng nhất. Không được viết ngắn hơn 1200 ký tự và không được dài hơn 1800 ký tự. Đây là yêu cầu bắt buộc.'
    : 'TUYỆT ĐỐI QUAN TRỌNG: Tổng độ dài của bài viết (article) PHẢI đạt tối thiểu 7200 ký tự (khoảng 1440 từ trở lên). Hãy viết cực kỳ chi tiết, mở rộng mọi khía cạnh, sử dụng nhiều ví dụ minh họa, câu chuyện kể và phân tích đa chiều. Chia bài viết thành nhiều phần lớn nhỏ rõ ràng. Nếu không đủ ý để đạt 7200 ký tự, hãy mở rộng thêm các góc nhìn liên quan. Đây là yêu cầu bắt buộc.';

    const marriageInstruction = category === 'Hôn nhân' 
        ? `
**YÊU CẦU ĐẶC BIỆT CHO LĨNH VỰC "HÔN NHÂN":** Khi viết về chủ đề này, bạn BẮT BUỘC phải phân tích sâu sắc và toàn diện về mọi khía cạnh của đời sống vợ chồng, bao gồm: giao tiếp, tài chính, con cái, mối quan hệ với gia đình hai bên, và cả sự hòa hợp về mặt thể chất và tình cảm (bao gồm cả đời sống tình dục). Khi đề cập đến khía cạnh tình dục, hãy sử dụng ngôn ngữ tinh tế, văn minh, mang tính giáo dục và xây dựng, tập trung vào sự kết nối và thấu hiểu giữa hai người. TUYỆT ĐỐI không sử dụng từ ngữ thô tục hay mô tả chi tiết gây phản cảm, vi phạm chính sách.
` 
        : '';

    return `Bạn là một chuyên gia viết lách đa tài, có khả năng hóa thân vào nhiều vai trò khác nhau (nhà tâm lý, chuyên gia kinh tế, nhà giáo dục, thiền sư, v.v.) tùy thuộc vào lĩnh vực được yêu cầu.${marriageInstruction}

**NHIỆM VỤ CỐT LÕI (ĐỘC NHẤT & SÁNG TẠO):**
Đây là lần tạo thứ: ${seed}. BẠN BẮT BUỘC PHẢI TẠO RA MỘT BÀI VIẾT HOÀN TOÀN MỚI, KHÁC BIỆT SO VỚI TẤT CẢ CÁC LẦN TRƯỚC.
- Ngay cả khi tiêu đề giống hệt lần trước, bạn PHẢI thay đổi hoàn toàn cách tiếp cận, giọng văn, cấu trúc và các ví dụ minh họa.
- Đừng lặp lại những lối mòn tư duy cũ. Hãy tìm một góc nhìn mới lạ, độc đáo hoặc trái ngược để phân tích vấn đề.
- Sự sáng tạo và tính mới mẻ là ưu tiên hàng đầu.

**YÊU CẦU VỀ VĂN PHONG & NỘI DUNG:**
*   **Bám sát Lĩnh vực:** 
    *   Nếu là "Kinh doanh": Dùng ngôn ngữ chuyên nghiệp, phân tích lợi ích, rủi ro, chiến lược.
    *   Nếu là "Phật pháp": Dùng ngôn ngữ từ bi, sâu sắc, hướng thiện, nhân quả.
    *   Nếu là "Tình yêu/Hôn nhân": Dùng ngôn ngữ thấu cảm, tâm lý, nhẹ nhàng.
    *   Các lĩnh vực khác: Điều chỉnh giọng văn cho phù hợp nhất với đối tượng độc giả của lĩnh vực đó.
*   **Cấu trúc:** Mở đầu nêu vấn đề, thân bài phân tích sâu sắc các khía cạnh thực tế, kết bài đúc kết thông điệp giá trị.
*   **Tính thực tế:** Bài viết phải đưa ra được những góc nhìn hoặc lời khuyên có thể áp dụng được, tránh lý thuyết sáo rỗng.

**YÊU CẦU KỸ THUẬT:**
1.  **Tiêu đề (title):** Lấy chủ đề gốc do người dùng cung cấp, viết hoa chữ cái đầu.
2.  **Bài viết (article):** 
    *   **BẮT BUỘC:** Câu đầu tiên của bài viết phải là một câu "Hook" (câu dẫn) cực kỳ thu hút, gây sốc nhẹ, tạo sự tò mò hoặc đánh trúng nỗi đau/mong muốn của người đọc ngay lập tức. Không được chào hỏi rườm rà, đi thẳng vào vấn đề.
    *   ${lengthInstruction}
    *   Không sử dụng icon/emoji trong bài viết chính.
3.  **Lời kêu gọi (engagementCall):** Một đoạn ngắn khuyến khích tương tác (like, share, comment) phù hợp với giọng văn của bài viết.

Chỉ trả về JSON, không thêm bất kỳ lời giải thích nào.`;
};

const getUserContent = (topic: string, category: string, seed: number, approach: string) => `
**LĨNH VỰC / GÓC NHÌN:** ${category}
**CHỦ ĐỀ MỚI CẦN VIẾT:** "${topic}"
**GÓC TIẾP CẬN BẮT BUỘC CHO LẦN NÀY:** "${approach}"
**MÃ NGẪU NHIÊN (Để tránh trùng lặp):** ${seed}

Hãy viết bài dựa trên lĩnh vực và chủ đề trên, TUÂN THỦ NGHIÊM NGẶT góc tiếp cận được chỉ định. Điều này giúp bài viết hoàn toàn khác biệt so với các lần trước.
`;

// Helper to auto-correct "im" to "Im"
const postProcessText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\b(im)\b/g, "Im");
};

const generateContentWithFallback = async (topic: string, category: string, length: ArticleLength, geminiKey: string, openaiKey: string, openRouterKey: string, selectedModel: string): Promise<GeneratedContent> => {
    const seed = Date.now(); 
    
    const approaches = [
        "Kể một câu chuyện đầy cảm xúc hoặc trải nghiệm cá nhân liên quan đến chủ đề",
        "Phân tích logic, khoa học, đi sâu vào nguyên nhân gốc rễ và giải pháp thực tế",
        "Sử dụng giọng văn khiêu khích, đặt câu hỏi ngược để thách thức tư duy người đọc",
        "Giọng văn tâm tình, nhẹ nhàng, chữa lành và đồng cảm sâu sắc",
        "Phong cách thẳng thắn, bộc trực, 'tát nước vào mặt' để thức tỉnh (Tough Love)",
        "Sử dụng phép ẩn dụ, hình tượng nghệ thuật để diễn giải vấn đề một cách bay bổng",
        "Hài hước, châm biếm nhẹ nhàng nhưng thâm thúy",
        "Tập trung vào các con số, dữ liệu hoặc các bước hành động cụ thể (Step-by-step)"
    ];
    const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];

    const systemInstruction = getSystemInstruction(length, seed, category);
    const userContent = getUserContent(topic, category, seed, randomApproach);
    let finalError;
    const CREATIVE_TEMP = 1.1;
    let rawResult: GeneratedContent | null = null;

    if (!rawResult && (selectedModel === 'gemini' || (selectedModel === 'auto' && geminiKey))) {
        try {
            if (!geminiKey && selectedModel === 'gemini') throw new Error("Gemini Key chưa được cài đặt.");
            const ai = new window.GoogleGenAI({ apiKey: geminiKey });
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: userContent,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: CREATIVE_TEMP,
                },
            });
            rawResult = JSON.parse(response.text.trim());
        } catch (e) {
            console.warn("Gemini failed", e);
            if (selectedModel === 'gemini') throw e;
            finalError = e;
        }
    }

    if (!rawResult && (selectedModel === 'openai' || (selectedModel === 'auto' && openaiKey))) {
        try {
            if (!openaiKey && selectedModel === 'openai') throw new Error("OpenAI Key chưa được cài đặt.");
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userContent }],
                    response_format: { type: "json_object" },
                    temperature: CREATIVE_TEMP,
                }),
            });
            if (!response.ok) throw new Error('OpenAI failed');
            const data = await response.json();
            rawResult = JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.warn("OpenAI failed", e);
            if (selectedModel === 'openai') throw e;
            finalError = e;
        }
    }

    if (!rawResult && (selectedModel === 'openrouter' || (selectedModel === 'auto' && openRouterKey))) {
        try {
            if (!openRouterKey && selectedModel === 'openrouter') throw new Error("OpenRouter Key chưa được cài đặt.");
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${openRouterKey}` },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-001",
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userContent }],
                    response_format: { type: "json_object" },
                    temperature: CREATIVE_TEMP,
                }),
            });
            if (!response.ok) throw new Error('OpenRouter failed');
            const data = await response.json();
            rawResult = JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.warn("OpenRouter failed", e);
            if (selectedModel === 'openrouter') throw e;
            finalError = e;
        }
    }

    if (rawResult) {
        return {
            title: rawResult.title,
            article: postProcessText(rawResult.article),
            engagementCall: postProcessText(rawResult.engagementCall)
        };
    }

    throw finalError || new Error("All providers failed or no API Key configured for selected model.");
};

// ==========================================
// 5. MAIN APP COMPONENT
// ==========================================

const ContentPodcastApp = ({ geminiApiKey, openaiApiKey, openRouterKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, openRouterKey: string, selectedAIModel: string }) => {
  const [topic, setTopic] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tình yêu');
  const [articleLength, setArticleLength] = useState<ArticleLength>('short');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'wav'>('mp3');


  const generatePromptFromContent = async (content: GeneratedContent, apiKey: string, provider: 'gemini' | 'openrouter' | 'openai') => {
      setIsGeneratingPrompt(true);
      setImagePrompt('');

      const promptRequest = `Based on the following article content and title, create a detailed, cinematic, photorealistic image generation prompt (in English). 
      
      **CRITICAL INSTRUCTIONS FOR CHARACTER COMPOSITION:**
      1.  **Analyze the Content:** Deeply analyze the article to determine the *implied* characters. 
          - **Explicitly extract the number of characters and their gender.**
          - If the topic is "Marriage" or "Love", the image MUST feature a **Man and a Woman** (or strictly follow the context if it specifies otherwise).
          - If the topic is "Parenting", feature **Parent(s) and Child(ren)**.
          - If the topic is "Loneliness", feature a **Single Person**.
          - If the topic is "Business/Negotiation", feature **Multiple Professionals**.
          - ALWAYS default to including both male and female figures if the topic involves relationships, unless specified otherwise.
      2.  **Determine Emotions:** The facial expressions and body language MUST perfectly match the mood of the article (e.g., joyful, teary-eyed, angry, pensive, hopeful).
      3.  **Output:** A concise but highly descriptive prompt focusing on the characters, their interaction, facial expressions, and the setting.
      
      Title: "${content.title}"
      Content Excerpt: "${content.article.substring(0, 2000)}..."
      
      Style: Cinematic, 8k, highly detailed, dramatic lighting.
      Output ONLY the prompt text. Do not include explanations.`;

      try {
          if (provider === 'gemini') {
              const ai = new window.GoogleGenAI({ apiKey });
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: promptRequest
              });
              setImagePrompt(response.text.trim());
          } else if (provider === 'openai') {
              const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: promptRequest }],
                }),
            });
            const data = await response.json();
            setImagePrompt(data.choices[0].message.content.trim());
          } else {
              const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-001",
                    messages: [{ role: "user", content: promptRequest }],
                }),
            });
            const data = await response.json();
            setImagePrompt(data.choices[0].message.content.trim());
          }
      } catch (err) {
          console.error("Error generating visual prompt:", err);
      } finally {
          setIsGeneratingPrompt(false);
      }
  }

  const handleGenerateAudio = async (voice: 'male' | 'female') => {
      if (!generatedContent) return;
      if (!geminiApiKey && !openaiApiKey) {
          setAudioError("Vui lòng cài đặt Gemini Key hoặc OpenAI Key để sử dụng tính năng tạo Audio.");
          return;
      }

      setIsGeneratingAudio(true);
      setAudioError(null);
      setAudioUrl(null);

      const textToSpeak = generatedContent.article + ". " + generatedContent.engagementCall;
      const safeText = textToSpeak.substring(0, 4096);

      if (geminiApiKey) {
          try {
              const geminiVoiceName = voice === 'male' ? 'Puck' : 'Aoede';
              const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-preview-tts',
                  contents: [{ parts: [{ text: safeText }] }],
                  config: {
                      responseModalities: [window.GenAIModality.AUDIO],
                      speechConfig: {
                          voiceConfig: {
                              prebuiltVoiceConfig: { voiceName: geminiVoiceName }
                          }
                      }
                  }
              });
              
              const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                  const binaryString = window.atob(base64Audio);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                  }
                  
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                  const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
                  const blob = audioBufferToWav(audioBuffer);
                  const url = URL.createObjectURL(blob);

                  setAudioUrl(url);
                  setAudioFormat('wav');
                  setIsGeneratingAudio(false);
                  return;
              }
          } catch (e) {
              console.warn("Gemini TTS failed, falling back to OpenAI", e);
          }
      }

      if (openaiApiKey) {
          try {
              const openAIVoice = voice === 'male' ? 'onyx' : 'shimmer';
              const response = await fetch('https://api.openai.com/v1/audio/speech', {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${openaiApiKey}`,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      model: 'tts-1',
                      input: safeText,
                      voice: openAIVoice
                  })
              });

              if (!response.ok) {
                  const errData = await response.json();
                  throw new Error(errData.error?.message || "Failed to generate audio");
              }

              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              setAudioUrl(url);
              setAudioFormat('mp3');
          } catch (err: any) {
              setAudioError(err.message);
          }
      } else {
          setAudioError("Gemini TTS thất bại và không có OpenAI Key để dự phòng.");
      }
      
      setIsGeneratingAudio(false);
  };

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập tiêu đề/chủ đề.');
      return;
    }
    
    if (!geminiApiKey && !openaiApiKey && !openRouterKey) {
        setError('Vui lòng nhập ít nhất một API Key trong phần cài đặt.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setGeneratedImageUrl(null);
    setImagePrompt('');
    setAudioUrl(null);
    setAudioError(null);

    try {
      const result = await generateContentWithFallback(topic, selectedCategory, articleLength, geminiApiKey, openaiApiKey, openRouterKey, selectedAIModel);
      setGeneratedContent(result);
      
      if ((selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
          generatePromptFromContent(result, geminiApiKey, 'gemini');
      } else if ((selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
          generatePromptFromContent(result, openaiApiKey, 'openai');
      } else if ((selectedAIModel === 'openrouter' || selectedAIModel === 'auto') && openRouterKey) {
          generatePromptFromContent(result, openRouterKey, 'openrouter');
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      setError(`Đã xảy ra lỗi khi tạo nội dung: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
      if (!imagePrompt) {
          setError('Chưa có prompt tạo ảnh. Vui lòng đợi tạo bài viết xong hoặc tự nhập prompt.');
          return;
      }

      setIsGeneratingImage(true);
      setError(null);
      setGeneratedImageUrl(null);

      let finalError = null;

      if (referenceImage) {
          if (geminiApiKey && (selectedAIModel === 'gemini' || selectedAIModel === 'auto')) {
              try {
                  const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
                  const faceSwapPrompt = `Generate a photorealistic image based on this description: ${imagePrompt}.
                   
                   **CRITICAL INSTRUCTION FOR FACE MAPPING:**
                   1.  **Identify Reference Gender:** STRICTLY analyze the gender of the person in the provided inline reference image. Is it Male or Female?
                   2.  **Target Selection:** Find the character in the prompt description that MATCHES this identified gender.
                   3.  **Apply Face:** Apply the face from the reference image ONLY to that specific matching character.
                   4.  **Non-Matching Characters:** If there are other characters in the scene (e.g., opposite gender), generate a generic face for them. DO NOT apply the reference face to them.
                   5.  **Context:** If the scene requires a Man and a Woman, and the reference is a Woman, apply her face to the Woman character. If the reference is a Man, apply his face to the Man character.
                   6.  Blend the face naturally with the lighting and emotion described.`;
                   
                   const imageResponse = await ai.models.generateContent({
                      model: 'gemini-2.5-flash-image',
                      contents: {
                          parts: [
                              { text: faceSwapPrompt },
                              { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } }
                          ]
                      },
                      config: { responseModalities: [window.GenAIModality.IMAGE] }
                   });
                   const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                   if (imagePart && imagePart.inlineData) {
                      setGeneratedImageUrl(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
                      setIsGeneratingImage(false);
                      return;
                   }
              } catch (e) {
                  console.warn("Gemini Face Swap failed", e);
                  finalError = e;
              }
          } else {
              setError("Cần có Gemini API Key (và chọn model Gemini hoặc Auto) để sử dụng tính năng ảnh mẫu khuôn mặt.");
              setIsGeneratingImage(false);
              return;
          }
      } 
      
      else {
          
          if (!finalError && (selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
              try {
                  const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
                  const imageResponse = await ai.models.generateImages({
                      model: 'imagen-4.0-generate-001',
                      prompt: imagePrompt,
                      config: {
                          numberOfImages: 1,
                          outputMimeType: 'image/png',
                          aspectRatio: '16:9'
                      }
                  });
                  if (imageResponse.generatedImages?.[0]?.image?.imageBytes) {
                      setGeneratedImageUrl(`data:image/png;base64,${imageResponse.generatedImages[0].image.imageBytes}`);
                      setIsGeneratingImage(false);
                      return;
                  }
              } catch (e) {
                  console.warn("Gemini Imagen failed", e);
                  if (selectedAIModel === 'gemini') finalError = e;
              }
          }

          if (!finalError && (selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
              try {
                  const response = await fetch('https://api.openai.com/v1/images/generations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                      body: JSON.stringify({
                          model: 'dall-e-3',
                          prompt: imagePrompt,
                          n: 1,
                          size: '1024x1024',
                          response_format: 'b64_json',
                          quality: 'hd',
                          style: 'vivid'
                      })
                  });
                  if (response.ok) {
                      const data = await response.json();
                      setGeneratedImageUrl(`data:image/png;base64,${data.data[0].b64_json}`);
                      setIsGeneratingImage(false);
                      return;
                  }
              } catch (e) {
                  console.warn("OpenAI Image Gen failed", e);
                  if (selectedAIModel === 'openai') finalError = e;
              }
          }

          if (!finalError && (selectedAIModel === 'openrouter' || selectedAIModel === 'auto') && openRouterKey) {
              try {
                  const systemPromptImage = "You are an expert image generation assistant. Generate high-quality images based on the user request.";
                  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openRouterKey}` },
                      body: JSON.stringify({
                          model: 'google/gemini-2.5-flash-image',
                          messages: [
                              { role: 'system', content: systemPromptImage },
                              { role: 'user', content: imagePrompt }
                          ]
                      })
                  });
                  
                  if (response.ok) {
                      const data = await response.json();
                      const content = data.choices[0].message.content;
                      const match = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
                      if (match && match[1]) {
                          setGeneratedImageUrl(match[1]);
                          setIsGeneratingImage(false);
                          return;
                      }
                  }
              } catch (e) {
                  console.warn("OpenRouter Image Gen failed", e);
                  finalError = e;
              }
          }
      }

      setIsGeneratingImage(false);
      setError(`Lỗi khi tạo ảnh: ${finalError instanceof Error ? finalError.message : 'Tất cả các API đều thất bại hoặc chưa được cấu hình.'}`);
  };

  const ToggleButton: React.FC<{ options: string[], selected: string, onSelect: (value: any) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex bg-gray-700 rounded-lg p-1">
      {options.map(option => (
        <button
          key={option}
          onClick={(e) => { e.stopPropagation(); onSelect(option); }}
          className={`w-full text-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none ${selected === option ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}
        >
          {option === 'short' ? 'Short' : 'Long'}
        </button>
      ))}
    </div>
  );

  const handleSaveGeneratedImage = () => {
      if (generatedImageUrl) {
          const link = document.createElement('a');
          link.href = generatedImageUrl;
          link.download = `podcast-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  return (
    <div className="w-full h-full p-4 font-sans text-gray-200">
      {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Left Panel: Controls & Image Gen */}
        <div className="flex flex-col space-y-6">
          <div className="bg-gray-800/50 border border-slate-700 p-6 rounded-xl shadow-lg">
             <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Chọn Lĩnh Vực / Chủ Đề</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); }}
                        className={`px-2 py-2 text-sm font-medium rounded-lg transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tiêu đề / Chủ đề bài viết</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Bí quyết giữ lửa hôn nhân, Cách vượt qua nỗi buồn..."
                    className="w-full bg-gray-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition h-24 resize-none"
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Độ dài bài viết</label>
                   <ToggleButton 
                      options={['short', 'long']} 
                      selected={articleLength} 
                      onSelect={(val) => setArticleLength(val as ArticleLength)} 
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     {articleLength === 'short' ? 'Khoảng 1200-1800 ký tự (phù hợp Tiktok - Facebook Reels - Youtube Shorts)' : 'Khoảng 7200+ ký tự (phù hợp Podcast Youtube dài)'}
                   </p>
                </div>

                <button
                  onClick={handleGenerateContent}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <LoadingSpinner /> : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                     </svg>
                  )}
                  {isLoading ? 'Đang viết bài...' : 'Viết Bài Ngay'}
                </button>

                {(generatedContent || imagePrompt) && (
                    <div className="animate-fade-in mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-600/50 relative">
                        <label className="block text-sm font-semibold text-pink-400 mb-2 flex justify-between items-center">
                            <span>Prompt Tạo Ảnh (AI đề xuất theo nội dung)</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(imagePrompt);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors font-bold"
                                    title="Sao chép Prompt"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Sao chép
                                </button>
                                {isGeneratingPrompt && <span className="text-xs animate-pulse text-gray-400">Đang tạo prompt...</span>}
                            </div>
                        </label>
                        <textarea
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-yellow-300 font-mono h-24 resize-none focus:ring-2 focus:ring-pink-500"
                            placeholder="Prompt sẽ xuất hiện ở đây sau khi viết bài..."
                        />
                        <button
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || !imagePrompt}
                            className="w-full mt-3 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGeneratingImage ? <LoadingSpinner /> : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                            )}
                            {isGeneratingImage ? 'Đang vẽ ảnh...' : 'Tạo Ảnh Minh Họa'}
                        </button>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start">
                    <div className="w-full sm:w-1/4 flex-shrink-0">
                        <ImageUploader 
                            uploadedImage={referenceImage} 
                            setUploadedImage={setReferenceImage} 
                            disabled={isGeneratingImage} 
                            label="Ảnh mẫu (Khuôn mặt)"
                        />
                    </div>
                    
                    <div className="w-full sm:w-3/4">
                        <div className="w-full bg-black/30 border border-slate-700 rounded-lg relative overflow-hidden flex items-center justify-center group min-h-[16rem]">
                            {generatedImageUrl ? (
                                <>
                                    <img 
                                        src={generatedImageUrl} 
                                        alt="Generated Result" 
                                        className="w-full h-auto object-contain cursor-pointer"
                                        onClick={() => setLightboxImage(generatedImageUrl)}
                                    />
                                    <button 
                                        onClick={handleSaveGeneratedImage}
                                        className="absolute top-2 right-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center gap-2"
                                        title="Tải ảnh"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Tải ảnh về
                                    </button>
                                </>
                            ) : (
                                <div className="text-slate-500 text-center p-4 flex flex-col items-center justify-center h-full">
                                    {isGeneratingImage ? <LoadingSpinner /> : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm">Kết quả ảnh sẽ hiện ở đây</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="mt-8 lg:mt-0 w-full pr-2">
            {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
                    <strong>Lỗi:</strong> {error}
                </div>
            )}

            {generatedContent ? (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-white">{generatedContent.title}</h2>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedContent.title);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Chép
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-4">
                            <h3 className="text-xl font-semibold text-indigo-400">Nội dung bài viết & Lời kêu gọi</h3>
                            <button
                                onClick={() => {
                                    const combinedText = generatedContent.article + "\n\n" + generatedContent.engagementCall;
                                    navigator.clipboard.writeText(combinedText).then(() => {
                                        setCopiedAll(true);
                                        setTimeout(() => setCopiedAll(false), 10000);
                                    });
                                }}
                                className={`px-4 py-2 font-bold rounded-md transition-colors shadow flex items-center gap-2 ${
                                    copiedAll ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                            >
                                {copiedAll ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Đã sao chép
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Sao chép toàn bộ
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed text-justify">
                            {generatedContent.article}
                            <div className="mt-4">
                                <p className="text-gray-300 italic">
                                    {generatedContent.engagementCall}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            Tạo Audio từ nội dung
                        </h3>
                        
                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => handleGenerateAudio('male')}
                                disabled={isGeneratingAudio}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isGeneratingAudio ? 'Đang tạo...' : 'Giọng Nam'}
                            </button>
                            <button
                                onClick={() => handleGenerateAudio('female')}
                                disabled={isGeneratingAudio}
                                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isGeneratingAudio ? 'Đang tạo...' : 'Giọng Nữ'}
                            </button>
                        </div>

                        {audioError && (
                            <div className="text-red-400 text-sm mb-4 p-2 bg-red-900/20 rounded">
                                {audioError}
                            </div>
                        )}

                        {audioUrl && (
                            <div className="space-y-4 animate-fade-in">
                                <audio controls src={audioUrl} className="w-full" />
                                <a 
                                    href={audioUrl} 
                                    download={`podcast_audio_${Date.now()}.${audioFormat}`}
                                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Tải Audio về máy (.{audioFormat})
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                !isLoading && (
                    <div className="flex items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-gray-900/20 p-10">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-lg">Nội dung bài viết sẽ hiển thị ở đây</p>
                        </div>
                    </div>
                )
            )}
            
            {isLoading && (
                 <div className="w-full animate-pulse flex flex-col gap-4 p-4">
                    <div className="h-8 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-40 bg-slate-700 rounded w-full"></div>
                    <div className="h-20 bg-slate-700 rounded w-full"></div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContentPodcastApp;

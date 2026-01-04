
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

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; 
    }
  }
  return buffer;
}

const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); 
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16); 
  setUint16(1); 
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); 
  setUint16(numOfChan * 2); 
  setUint16(16); 
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < numOfChan; i++) {
    const channel = buffer.getChannelData(i);
    let p = 44 + (i * 2);
    for (let j = 0; j < channel.length; j++) {
      let sample = Math.max(-1, Math.min(1, channel[j]));
      view.setInt16(p, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      p += numOfChan * 2;
    }
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
  const baseClasses = "px-4 py-2 font-bold rounded-lg transition-colors shadow-md flex items-center gap-2 text-sm";
  const stateClasses = copied ? "bg-green-600 hover:bg-green-700 text-white" : (className || "bg-gray-700 hover:bg-gray-600 text-gray-300");
  return (
    <button onClick={handleCopy} className={`${baseClasses} ${stateClasses}`}>
      {copied ? "Đã sao chép" : (label || 'Chép')}
    </button>
  );
};

const Lightbox = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Enlarged result" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl mb-4" />
        <div className="flex gap-4">
          <button onClick={() => { const link = document.createElement('a'); link.href = imageUrl; link.download = `img-${Date.now()}.png`; link.click(); }} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg">Tải về</button>
          <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg">Đóng</button>
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
            setUploadedImage({ id: `${file.name}-${Date.now()}`, base64: reader.result.split(',')[1], dataUrl: reader.result, mimeType: file.type });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    return (
        <div className="flex flex-col items-center w-full">
          <label className="block text-sm font-medium text-gray-300 mb-2 text-center w-full truncate">{label}</label>
          <div className={`w-full aspect-square bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center transition relative group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-700'}`} onClick={() => !disabled && fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" disabled={disabled} />
            {uploadedImage ? (
              <>
                <img src={uploadedImage.dataUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                <button onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }} className="absolute top-1 right-1 bg-red-600/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
              </>
            ) : <span className="text-xs text-gray-500">Tải ảnh mặt</span>}
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
    title: { type: Type.STRING },
    article: { type: Type.STRING },
    engagementCall: { type: Type.STRING },
  },
  required: ["title", "article", "engagementCall"],
};

const getSystemInstruction = (length: ArticleLength, seed: string, category: string) => {
    const lengthInstruction = length === 'short'
    ? 'BẮT BUỘC: Độ dài bài viết (article) trong khoảng 1500-2200 ký tự.'
    : 'BẮT BUỘC: Độ dài bài viết (article) tối thiểu 8800 ký tự, khai thác cực kỳ sâu sắc.';

    return `Bạn là chuyên gia sáng tạo nội dung Podcast. 
NHIỆM VỤ: Viết bài chia sẻ sâu sắc về chủ đề người dùng yêu cầu.

MÃ NHẬN DIỆN DUY NHẤT (SEED): ${seed}.
YÊU CẦU BẮT BUỘC: Dựa trên mã Seed này, bạn PHẢI tạo ra nội dung HOÀN TOÀN MỚI. Tuyệt đối không lặp lại cấu trúc, ý tưởng hay câu chữ của bất kỳ lần phản hồi nào trước đó ngay cả khi cùng chủ đề. Mỗi bài viết là một tác phẩm độc bản với góc nhìn mới lạ.

PHONG CÁCH: Sâu sắc, cảm xúc, kể chuyện, ngôn ngữ tự nhiên như đang tâm sự.
KỸ THUẬT:
1. Tiêu đề: Viết hoa chữ cái đầu mỗi từ.
2. Bài viết: ${lengthInstruction}. Tách đoạn hợp lý, không dùng icon, không dùng dòng trống giữa các đoạn.
3. Kêu gọi: Lời nhắn gửi tinh tế và CTA tương tác ở cuối.

Chỉ trả về định dạng JSON hợp lệ.`;
};

const generateContentWithFallback = async (topic: string, category: string, length: ArticleLength, geminiKey: string, openaiKey: string, selectedModel: string): Promise<GeneratedContent> => {
    const seed = (Math.random() * Date.now()).toString(36); 
    const systemInstruction = getSystemInstruction(length, seed, category);
    const userContent = `LĨNH VỰC: ${category}. CHỦ ĐỀ: ${topic}. MÃ SEED: ${seed}. Hãy viết nội dung độc nhất vô nhị.`;
    
    let rawResult: GeneratedContent | null = null;
    
    // Ưu tiên OpenAI cho Văn bản nếu được chọn, hoặc Tự động (OpenAI -> Gemini)
    if (!rawResult && (selectedModel === 'openai' || (selectedModel === 'auto' && openaiKey))) {
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userContent }],
                    response_format: { type: "json_object" },
                    temperature: 1.0,
                }),
            });
            if (response.ok) {
              const data = await response.json();
              rawResult = JSON.parse(data.choices[0].message.content);
            }
        } catch (e) { console.warn("OpenAI failed", e); }
    }

    if (!rawResult && (selectedModel === 'gemini' || (selectedModel === 'auto' && geminiKey))) {
        try {
            const ai = new window.GoogleGenAI({ apiKey: geminiKey });
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: userContent,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema, temperature: 1.0 },
            });
            rawResult = JSON.parse(response.text || "{}");
        } catch (e) { console.warn("Gemini failed", e); }
    }

    if (rawResult) return rawResult;
    throw new Error("Không thể tạo nội dung từ các nhà cung cấp.");
};

// ==========================================
// 5. MAIN APP COMPONENT
// ==========================================

const ContentPodcastApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }) => {
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

  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');

  // Ưu tiên Gemini xử lý Prompt tạo ảnh
  const generatePromptFromContent = async (content: GeneratedContent) => {
      setIsGeneratingPrompt(true);
      const seed = Date.now();
      const promptRequest = `Dựa vào nội dung bài viết sau, hãy tạo 1 prompt tạo ảnh siêu thực (English). 
      
      YÊU CẦU BẮT BUỘC VỀ BỐI CẢNH & TRANG PHỤC:
      1. THAY ĐỔI TRANG PHỤC THEO CHỦ ĐỀ: Nếu bài viết về Hôn nhân, Tình yêu, Sự gần gũi -> Bối cảnh PHẢI là phòng ngủ ấm cúng, sang trọng. Nhân vật mặc đồ ngủ lụa (Sexy Silk Pajamas) hoặc trang phục mặc nhà quyến rũ.
      2. KHÔNG DÙNG TRANG PHỤC GỐC: Tuyệt đối không mô tả trang phục giống trong ảnh tham khảo. Hãy sáng tạo bộ đồ hoàn toàn mới phù hợp bối cảnh bài viết.
      3. NGOẠI HÌNH NHÂN VẬT NỮ: Luôn có thân hình cực kỳ sexy, gợi cảm, vòng 1 và vòng 3 đầy đặn quyến rũ.
      4. MÃ SEED DUY NHẤT: ${seed} (Tạo prompt độc bản không lặp lại).
      5. CHẤT LƯỢNG: Cinematic lighting, 8k, photorealistic, professional photography.
      
      Tiêu đề: ${content.title}
      Nội dung: ${content.article.substring(0, 1000)}
      
      Chỉ xuất prompt bằng tiếng Anh, không giải thích.`;

      try {
          const providerKey = geminiApiKey || openaiApiKey;
          if (!providerKey) throw new Error("Thiếu API Key.");
          
          let pText = "";
          if (geminiApiKey) {
              const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
              const response = await ai.models.generateContent({
                  model: 'gemini-3-pro-preview',
                  contents: promptRequest
              });
              pText = response.text || "";
          } else {
              const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiApiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: promptRequest }],
                }),
            });
            const data = await response.json();
            pText = data.choices[0].message.content;
          }
          setImagePrompt(pText.trim());
      } catch (err) { console.error(err); } finally { setIsGeneratingPrompt(false); }
  }

  const handleGenerateContent = async () => {
    if (!topic.trim()) return setError('Vui lòng nhập chủ đề.');
    setIsLoading(true); setError(null); setGeneratedContent(null); setGeneratedImageUrl(null); setImagePrompt('');
    try {
      const result = await generateContentWithFallback(topic, selectedCategory, articleLength, geminiApiKey, openaiApiKey, selectedAIModel);
      setGeneratedContent(result);
      await generatePromptFromContent(result);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  // ƯU TIÊN GEMINI XỬ LÝ HÌNH ẢNH
  const handleGenerateImage = async () => {
      if (!imagePrompt || !geminiApiKey) return setError('Tính năng tạo ảnh ưu tiên Gemini. Vui lòng cài đặt Gemini API Key.');
      setIsGeneratingImage(true); setError(null); setGeneratedImageUrl(null);
      try {
          const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
          let imageUrl = '';
          
          if (referenceImage) {
               // Logic Face Swap / Identity Preserving với Gemini
               const faceSwapPrompt = `Generate a photograph. ${imagePrompt}. 
               CRITICAL: 
               - Preserve facial identity from the provided image exactly.
               - IGNORE ORIGINAL CLOTHING: The character must NOT wear the clothing from the photo. Apply the thematic outfit described in the prompt (e.g., silk pajamas).
               - Subject MUST have a curvaceous, sexy body with prominent bust and hips.`;
               
               const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: { parts: [
                    { text: faceSwapPrompt },
                    { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } }
                  ] },
                  config: { responseModalities: [window.GenAIModality.IMAGE] },
               });
               
               const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
               if (imagePart?.inlineData) {
                  imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
               }
          } else {
              // Text-to-Image với Imagen
              const response = await ai.models.generateImages({
                  model: 'imagen-4.0-generate-001',
                  prompt: imagePrompt,
                  config: { numberOfImages: 1, aspectRatio: '16:9' }
              });
              if (response.generatedImages?.[0]?.image?.imageBytes) {
                  imageUrl = `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
              }
          }
          
          if (imageUrl) setGeneratedImageUrl(imageUrl);
          else throw new Error("Gemini không trả về kết quả ảnh.");
          
      } catch (err: any) { 
        console.error(err);
        setError("Lỗi tạo ảnh: " + err.message); 
      } finally { setIsGeneratingImage(false); }
  };

  const handleGenerateAudio = async () => {
    if (!generatedContent || !geminiApiKey) return;
    setIsGeneratingAudio(true); setAudioUrl(null);
    try {
      const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: generatedContent.article }] }],
        config: {
          responseModalities: [window.GenAIModality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceGender === 'male' ? 'Kore' : 'Zephyr' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = window.atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
        const wavBlob = audioBufferToWav(audioBuffer);
        setAudioUrl(URL.createObjectURL(wavBlob));
      }
    } catch (err: any) { console.error(err); } finally { setIsGeneratingAudio(false); }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col lg:flex-row gap-8 text-slate-200">
      {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
      
      {/* CỘT TRÁI */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            Thiết lập nội dung
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Chủ đề bài viết</label>
              <textarea 
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all h-24 resize-none"
                placeholder="VD: Bí quyết giữ lửa hôn nhân..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Lĩnh vực</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm outline-none"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Độ dài</label>
                <div className="flex bg-slate-900 rounded-lg p-1">
                  <button onClick={() => setArticleLength('short')} className={`flex-1 py-1 text-xs rounded transition font-bold ${articleLength === 'short' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Ngắn</button>
                  <button onClick={() => setArticleLength('long')} className={`flex-1 py-1 text-xs rounded transition font-bold ${articleLength === 'long' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Dài</button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerateContent} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : 'TẠO BÀI VIẾT ĐỘC BẢN'}
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Ảnh minh họa (Gemini)
          </h2>
          <div className="space-y-6">
            <ImageUploader label="Ảnh mẫu (Chỉ lấy mặt)" uploadedImage={referenceImage} setUploadedImage={setReferenceImage} disabled={isGeneratingImage} />
            
            <div>
               <label className="block text-sm font-semibold text-slate-400 mb-2">Prompt tạo ảnh</label>
               <textarea 
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-xs font-mono text-yellow-300 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                placeholder="AI sẽ tự động tạo prompt..."
              />
            </div>

            <button 
              onClick={handleGenerateImage} 
              disabled={isGeneratingImage || !imagePrompt}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
            >
              {isGeneratingImage ? <LoadingSpinner /> : 'VẼ ẢNH VỚI GEMINI'}
            </button>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        {error && <div className="bg-red-900/50 border border-red-700 p-4 rounded-xl text-red-300 text-sm animate-shake">{error}</div>}
        
        {generatedContent ? (
          <div className="flex flex-col gap-6">
            {/* Audio Player */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row items-center gap-6">
               <div className="flex-1 space-y-4 w-full">
                  <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    Tạo âm thanh kịch bản
                  </h3>
                  <div className="flex gap-4">
                     <button onClick={() => setVoiceGender('female')} className={`px-4 py-2 rounded-lg text-sm transition font-bold ${voiceGender === 'female' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-500'}`}>Giọng Nữ</button>
                     <button onClick={() => setVoiceGender('male')} className={`px-4 py-2 rounded-lg text-sm transition font-bold ${voiceGender === 'male' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>Giọng Nam</button>
                  </div>
                  <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="w-full bg-cyan-600 hover:bg-cyan-500 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {isGeneratingAudio ? <LoadingSpinner /> : 'XUẤT FILE ÂM THANH'}
                  </button>
               </div>
               <div className="w-full md:w-64 h-24 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center">
                  {audioUrl ? <audio controls src={audioUrl} className="w-full px-4" /> : <span className="text-xs text-slate-600 italic">Chưa có âm thanh</span>}
               </div>
            </div>

            {/* Nội dung bài viết */}
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {generatedImageUrl && (
                  <div className="w-full md:w-48 aspect-square flex-shrink-0 relative group">
                    <img 
                      src={generatedImageUrl} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover rounded-xl cursor-pointer ring-2 ring-purple-500/50" 
                      onClick={() => setLightboxImage(generatedImageUrl)}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 mb-4">{generatedContent.title}</h1>
                  <div className="flex gap-2">
                    <CopyButton textToCopy={generatedContent.title} label="Tiêu đề" />
                    <CopyButton textToCopy={generatedContent.article} label="Nội dung" className="bg-blue-600 hover:bg-blue-500 text-white" />
                  </div>
                </div>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium">
                {generatedContent.article.split('\n').map((para, i) => <p key={i} className="mb-4 text-justify">{para}</p>)}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-700 italic text-slate-400 text-sm bg-slate-900/50 p-4 rounded-xl">
                 {generatedContent.engagementCall}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl min-h-[500px] text-slate-500 opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <h3 className="text-2xl font-light uppercase tracking-widest">Sẵn sàng sáng tạo</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentPodcastApp;


import React, { useState, useRef } from 'react';
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
  const channels: Float32Array[] = [];
  let i: number, sample: number;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
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

  const baseClasses = "px-4 py-2 font-bold rounded-lg transition-colors shadow-md flex items-center gap-2 text-sm";
  const stateClasses = copied 
    ? "bg-green-600 hover:bg-green-700 text-white" 
    : (className || "bg-gray-700 hover:bg-gray-600 text-gray-300");

  return (
    <button onClick={handleCopy} className={`${baseClasses} ${stateClasses}`}>
      {copied ? (
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
            {label || 'Chép'}
          </>
      )}
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
        <img src={imageUrl} alt="Enlarged result" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl mb-4" />
        <div className="flex gap-4">
           <button onClick={handleSave} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải ảnh về
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors shadow-lg">Đóng</button>
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
            <label className="block text-sm font-medium text-gray-300 mb-2 text-center w-full truncate" title={label}>{label}</label>
          )}
          <div 
            className={`w-full aspect-square bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center transition relative group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-700 hover:border-slate-500'}`}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" disabled={disabled} />
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
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-500 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    title: { type: Type.STRING, description: "Tiêu đề của bài viết." },
    article: { type: Type.STRING, description: "Nội dung chính của bài viết." },
    engagementCall: { type: Type.STRING, description: "Lời kêu gọi tương tác." },
  },
  required: ["title", "article", "engagementCall"],
};

const getSystemInstruction = (length: ArticleLength, seed: number) => {
    const lengthInstruction = length === 'short'
    ? 'Độ dài bài viết: 1500-2200 ký tự.'
    : 'Độ dài bài viết: tối thiểu 8800 ký tự.';

    return `Bạn là chuyên gia Content Podcast. 
Nhiệm vụ: Viết bài chia sẻ sâu sắc.
Yêu cầu:
1. Tiêu đề: Viết hoa chữ cái đầu mỗi từ.
2. Bài viết: ${lengthInstruction}. Không icon.
3. Luôn kết thúc bằng câu hỏi tương tác.
4. Trả về JSON hợp lệ. Seed: ${seed}`;
};

const generateContentWithFallback = async (topic: string, category: string, length: ArticleLength, geminiKey: string, openaiKey: string, selectedModel: string): Promise<GeneratedContent> => {
    const seed = Date.now(); 
    const systemInstruction = getSystemInstruction(length, seed);
    const userContent = `Chủ đề: "${topic}". Lĩnh vực: ${category}.`;
    
    let rawResult: GeneratedContent | null = null;
    
    if (selectedModel === 'openai' || (selectedModel === 'auto' && openaiKey)) {
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userContent }],
                    response_format: { type: "json_object" },
                }),
            });
            if (response.ok) {
                const data = await response.json();
                rawResult = JSON.parse(data.choices[0].message.content);
            }
        } catch (e) { console.error(e); }
    }

    if (!rawResult && (selectedModel === 'gemini' || selectedModel === 'auto')) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: userContent,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        rawResult = JSON.parse(response.text || "{}");
    }

    if (rawResult) return rawResult;
    throw new Error("Không thể tạo nội dung.");
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

  const generatePromptFromContent = async (content: GeneratedContent) => {
      setIsGeneratingPrompt(true);
      setError(null);
      
      const promptRequest = `Analyze this article title and content: "${content.title}. ${content.article.substring(0, 500)}".
      
      MANDATORY RULES FOR IMAGE PROMPT (ENGLISH ONLY):
      1. DETECT SUBJECTS: If keywords mention marriage (vợ chồng), love (tình yêu), or couple, describe TWO subjects (a man and a woman). Otherwise use 1 person.
      2. DETECT COSTUME: If keywords mention bedroom (phòng ngủ), night (đêm), or intimacy, describe "luxury silk loungewear" or "elegant sleepwear".
      3. STYLE: High-end editorial cinematic photography, 8k, photorealistic, atmospheric mood lighting, soft background blur.
      4. Avoid explicit words. Use "artistic", "glamorous", "classic proportions".
      
      Output ONLY the English prompt.`;

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: promptRequest
          });
          const text = response.text;
          if (text) {
              setImagePrompt(text.trim());
          } else {
              throw new Error("Không thể tạo Prompt ảnh.");
          }
      } catch (err: any) {
          console.error("Visual Prompt Error:", err);
          setError(`Lỗi tạo Prompt: ${err.message}`);
      } finally {
          setIsGeneratingPrompt(false);
      }
  }

  const handleGenerateAudio = async (voice: 'male' | 'female') => {
      if (!generatedContent) return;
      setIsGeneratingAudio(true);
      setAudioUrl(null);
      const textToSpeak = generatedContent.article + ". " + generatedContent.engagementCall;
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-preview-tts',
              contents: [{ parts: [{ text: textToSpeak.substring(0, 3500) }] }],
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'male' ? 'Puck' : 'Aoede' } }
                  }
              }
          });
          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
              const binaryString = window.atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
              const audioContext = new AudioContext({ sampleRate: 24000 });
              const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
              const blob = audioBufferToWav(audioBuffer);
              setAudioUrl(URL.createObjectURL(blob));
          }
      } catch (e) { console.error(e); } finally { setIsGeneratingAudio(false); }
  };

  const handleGenerateContent = async () => {
    if (!topic.trim()) return;
    setIsLoading(true); setError(null); setGeneratedContent(null); setGeneratedImageUrl(null); setImagePrompt(''); setAudioUrl(null);
    try {
      const result = await generateContentWithFallback(topic, selectedCategory, articleLength, geminiApiKey, openaiApiKey, selectedAIModel);
      setGeneratedContent(result);
      await generatePromptFromContent(result);
    } catch (err: any) { setError(`Lỗi: ${err.message}`); } finally { setIsLoading(false); }
  };

  const handleGenerateImage = async () => {
      if (!imagePrompt) return;
      setIsGeneratingImage(true); setError(null); setGeneratedImageUrl(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          let imageUrl = '';
          if (referenceImage) {
               const faceSwapPrompt = `Maintain identity from reference image. Scene: ${imagePrompt}. High-end cinematic professional photograph. 8k. Realistic.`;
               const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: { parts: [{ text: faceSwapPrompt }, { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } }] }
               });
               const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
               if (part?.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          } else {
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: `${imagePrompt}. Cinematic editorial style, 8k.`
              });
              const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
              if (part?.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
          if (imageUrl) setGeneratedImageUrl(imageUrl);
          else throw new Error("AI không trả về ảnh. Hãy thử tạo lại Prompt mới.");
      } catch (err: any) { setError(`Lỗi tạo ảnh: ${err.message}`); } finally { setIsGeneratingImage(false); }
  };

  const ToggleButton: React.FC<{ options: string[], selected: string, onSelect: (value: any) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex bg-gray-700 rounded-lg p-1">
      {options.map(option => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`w-full text-center px-4 py-2 text-sm font-medium rounded-md transition-all ${selected === option ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}
        >
          {option === 'short' ? 'Short' : 'Long'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full p-4 font-sans text-gray-200">
      {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <div className="flex flex-col space-y-6">
          <div className="bg-gray-800/50 border border-slate-700 p-6 rounded-xl shadow-lg space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Chọn Lĩnh Vực / Chủ Đề</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2 py-2 text-sm font-medium rounded-lg transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{cat}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tiêu đề / Chủ đề bài viết</label>
              <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ví dụ: Bí quyết giữ lửa hôn nhân..." className="w-full bg-gray-900 border border-slate-600 rounded-lg p-3 text-white h-24 resize-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-2">Độ dài bài viết</label>
               <ToggleButton options={['short', 'long']} selected={articleLength} onSelect={setArticleLength} />
            </div>
            <button onClick={handleGenerateContent} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all">
              {isLoading ? <LoadingSpinner /> : null} {isLoading ? 'Đang viết bài...' : 'Viết Bài Ngay'}
            </button>
            {(generatedContent || imagePrompt) && (
              <div className="animate-fade-in mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-600/50 relative space-y-3">
                  <label className="block text-sm font-semibold text-pink-400 flex justify-between items-center">
                      <span>Prompt Tạo Ảnh Nghệ Thuật</span>
                      <button onClick={() => navigator.clipboard.writeText(imagePrompt)} className="px-3 py-1 text-xs bg-pink-600 text-white rounded font-bold">Sao chép</button>
                  </label>
                  <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-sm text-yellow-300 font-mono h-24 resize-none" />
                  <button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt} className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-bold py-2 px-4 rounded shadow-lg flex items-center justify-center gap-2">
                      {isGeneratingImage ? <LoadingSpinner /> : null} {isGeneratingImage ? 'Đang vẽ ảnh...' : 'Vẽ Ảnh Minh Họa'}
                  </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start">
                <div className="w-full sm:w-1/4"><ImageUploader uploadedImage={referenceImage} setUploadedImage={setReferenceImage} disabled={isGeneratingImage} label="Ảnh Face Tham Khảo" /></div>
                <div className="w-full sm:w-3/4 min-h-[16rem] bg-black/30 border border-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {generatedImageUrl ? <img src={generatedImageUrl} alt="AI Result" className="w-full h-auto object-contain cursor-pointer" onClick={() => setLightboxImage(generatedImageUrl)} /> : <p className="text-slate-500 text-sm">{isGeneratingImage ? <LoadingSpinner /> : "Ảnh sẽ hiện ở đây"}</p>}
                </div>
            </div>
          </div>
        </div>
        <div className="space-y-6 pr-2">
            {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">{error}</div>}
            {generatedContent ? (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-white uppercase">{generatedContent.title}</h2>
                        <CopyButton textToCopy={generatedContent.title} className="bg-blue-600 text-white" />
                    </div>
                    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-600 pb-4">
                            <h3 className="text-xl font-semibold text-indigo-400">Nội dung Podcast</h3>
                            <CopyButton textToCopy={generatedContent.article + "\n\n" + generatedContent.engagementCall} label="Chép tất cả" className="bg-purple-600 text-white" />
                        </div>
                        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-justify">{generatedContent.article}<p className="mt-4 italic text-indigo-300">{generatedContent.engagementCall}</p></div>
                    </div>
                    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-indigo-400">Tạo Audio Podcast</h3>
                        <div className="flex gap-4">
                            <button onClick={() => handleGenerateAudio('male')} disabled={isGeneratingAudio} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded transition-opacity disabled:opacity-50">{isGeneratingAudio ? 'Đang tạo...' : 'Giọng Nam'}</button>
                            <button onClick={() => handleGenerateAudio('female')} disabled={isGeneratingAudio} className="flex-1 bg-pink-600 text-white font-bold py-2 rounded transition-opacity disabled:opacity-50">{isGeneratingAudio ? 'Đang tạo...' : 'Giọng Nữ'}</button>
                        </div>
                        {audioUrl && <audio controls src={audioUrl} className="w-full mt-2" />}
                    </div>
                </div>
            ) : (!isLoading && <div className="flex items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-gray-900/20"><p className="text-lg">Nội dung sẽ hiển thị ở đây</p></div>)}
            {isLoading && <div className="w-full animate-pulse space-y-4"><div className="h-8 bg-slate-700 rounded w-3/4"></div><div className="h-40 bg-slate-700 rounded w-full"></div></div>}
        </div>
      </div>
    </div>
  );
};

export default ContentPodcastApp;

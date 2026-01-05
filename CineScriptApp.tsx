
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// ==========================================
// 1. TYPES & ENUMS
// ==========================================

export enum FilmStyle {
  CINEMATIC = 'Điện ảnh (Cinematic)',
  ANIMATION = 'Hoạt hình (Animation)'
}

export enum CostumeMode {
  ORIGINAL = 'Trang phục gốc',
  AUTO = 'Auto trang phục',
  SEXY = 'Gợi cảm'
}

export interface ScriptRequest {
  idea: string;
  duration: number;
  style: FilmStyle;
  imageData?: string;
  imageMimeType?: string;
  optionalImageData?: string;
  optionalImageMimeType?: string;
  costumeMode: CostumeMode;
}

export interface PromptItem {
  vi: string;
  en: string;
}

export interface GeneratedContent {
  title: PromptItem;
  context: PromptItem[];
  generated_costume_prompt?: PromptItem;
  characters: PromptItem[];
  script: PromptItem[];
}

// ==========================================
// 2. ICONS
// ==========================================
const Icons = {
  VideoCamera: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
  Sparkles: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  Photo: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  XMark: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  UserPlus: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  Clipboard: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>,
  Check: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  Download: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  Map: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  UserGroup: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Film: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0121 18.375m-16.5-6.375h1.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A1.125 1.125 0 014.5 12zm16.5-6.375h-1.5a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5a1.125 1.125 0 001.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125zm-16.5 0h1.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5A1.125 1.125 0 014.5 6v-1.5a1.125 1.125 0 011.125-1.125z" /></svg>,
  Pencil: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  Plus: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  ArrowPath: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
  Copy: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>,
};

// ==========================================
// 3. UTILS & AI SERVICES
// ==========================================

const cleanJsonString = (str: string): string => {
    return str.replace(/```json\n?|```/g, '').trim();
};

const buildBasePrompt = (request: ScriptRequest, sceneCount: number, randomSeed: string) => {
    const { idea, duration, style, costumeMode } = request;
    let costumeInstruction = "";
    let generatedCostumeInstruction = "";

    if (request.imageData) {
        if (costumeMode === CostumeMode.ORIGINAL) {
            costumeInstruction = `
       - CÓ ẢNH THAM KHẢO KÈM THEO (CHẾ ĐỘ: TRANG PHỤC GỐC): 
         + Hãy phân tích kỹ khuôn mặt, tóc, dáng người VÀ ĐẶC BIỆT LÀ TRANG PHỤC (quần áo, màu sắc, phụ kiện) của nhân vật trong ảnh.
         + BẮT BUỘC: Trong tất cả các prompt kịch bản, bất cứ khi nào nhân vật này xuất hiện, bạn PHẢI mô tả lại chính xác bộ trang phục gốc đó kèm màu sắc và chất liệu.
         + MỤC TIÊU: Giữ nguyên vẹn thiết kế nhân vật từ ảnh mẫu.`;
        } else if (costumeMode === CostumeMode.AUTO) {
            costumeInstruction = `
       - CÓ ẢNH THAM KHẢO KÈM THEO (CHẾ ĐỘ: AUTO TRANG PHỤC - THÔNG MINH & NHẤT QUÁN):
         + BƯỚC 1 (KHỞI TẠO): Phân tích ý tưởng để TỰ CHỌN một bộ trang phục phù hợp nhất.
         + BƯỚC 2 (KHÓA THIẾT KẾ): Xác định chi tiết bộ trang phục đó ngay từ đầu.
         + BƯỚC 3 (LUẬT BẤT BIẾN - NHẤT QUÁN XUYÊN SUỐT):
           * Trong MỌI PROMPT bạn BẮT BUỘC phải mô tả lại đầy đủ bộ trang phục này.
         + BƯỚC 4 (DIỄN BIẾN TRẠNG THÁI):
           * Trang phục ĐƯỢC PHÉP thay đổi độ bẩn/rách/ướt theo hoàn cảnh.`;
            generatedCostumeInstruction = `
       - VÌ CHẾ ĐỘ LÀ "AUTO TRANG PHỤC", bạn BẮT BUỘC phải tạo ra một trường "generated_costume_prompt" riêng biệt.`;
        } else if (costumeMode === CostumeMode.SEXY) {
            costumeInstruction = `
       - CÓ ẢNH THAM KHẢO KÈM THEO (CHẾ ĐỘ: TRANG PHỤC GỢI CẢM):
         + NHIỆM VỤ: Hãy SÁNG TẠO ra một bộ trang phục mang phong cách GỢI CẢM, QUYẾN RŨ nhưng vẫn tinh tế.`;
            generatedCostumeInstruction = `
       - VÌ CHẾ ĐỘ LÀ "GỢI CẢM", bạn BẮT BUỘC phải tạo ra một trường "generated_costume_prompt" riêng biệt.`;
        }
    }
    return `Bạn là một chuyên gia viết PROMPT tạo video AI... [Prompt detail omitted for brevity] ... ${costumeInstruction} ${generatedCostumeInstruction}`;
};

const generateScript = async (request: ScriptRequest, geminiApiKey: string, openaiApiKey: string, selectedModel: string): Promise<GeneratedContent> => {
    const totalSeconds = request.duration * 60;
    const sceneCount = Math.ceil(totalSeconds / 8);
    const randomSeed = Math.random().toString(36).substring(7) + Date.now();
    const basePrompt = buildBasePrompt(request, sceneCount, randomSeed);
    let finalError: unknown;
    let result: GeneratedContent | null = null;

    if ((selectedModel === 'gemini' || (selectedModel === 'auto'))) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] },
                    context: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
                    generated_costume_prompt: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, nullable: true },
                    characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
                    script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
                },
                required: ["title", "context", "characters", "script"],
            };
            const parts: any[] = [{ text: basePrompt }];
            if (request.imageData && request.imageMimeType) parts.push({ inlineData: { data: request.imageData, mimeType: request.imageMimeType } });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: parts }],
                config: { temperature: 0.9, responseMimeType: "application/json", responseSchema: responseSchema }
            });
            result = JSON.parse(cleanJsonString(response.text || "{}")) as GeneratedContent;
        } catch (err) { finalError = err; }
    }
    if (!result && (selectedModel === 'openai' || (selectedModel === 'auto' && openaiApiKey))) {
        try {
            const messages: any[] = [{ role: "user", content: [{ type: "text", text: basePrompt }] }];
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: "gpt-4o", messages: messages, response_format: { type: "json_object" }, temperature: 0.9 })
            });
            const apiResult = await response.json();
            result = JSON.parse(apiResult.choices[0].message.content) as GeneratedContent;
        } catch (e) { finalError = e; }
    }
    if (result) return result;
    throw finalError || new Error("Lỗi tạo kịch bản.");
};

const generateSingleScene = async (instruction: string, style: FilmStyle, geminiApiKey: string, openaiApiKey: string, selectedModel: string): Promise<PromptItem> => {
    const prompt = `Viết MỘT PROMPT DUY NHẤT dựa trên: "${instruction}". Style: ${style}... Trả về JSON: { "vi": "...", "en": "..." }`;
    let result: PromptItem | null = null;
    if ((selectedModel === 'gemini' || selectedModel === 'auto')) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { temperature: 0.9, responseMimeType: "application/json" }
            });
            result = JSON.parse(cleanJsonString(response.text || "{}")) as PromptItem;
        } catch (err) {}
    }
    if (result) return result;
    throw new Error("Lỗi tạo cảnh.");
};

const SceneInputForm = ({ initialText = '', placeholder, submitLabel, onCancel, onSubmit, isProcessing }: any) => {
  const [text, setText] = useState(initialText);
  return (
    <div className="my-3 bg-slate-800 p-3 rounded border border-cyan-500/50">
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-slate-900 text-white p-2 rounded h-24 mb-2" placeholder={placeholder} disabled={isProcessing} />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-slate-400">Hủy</button>
        <button onClick={() => onSubmit(text)} className="bg-cyan-600 px-4 py-1 rounded text-white">{submitLabel}</button>
      </div>
    </div>
  );
};

const CineScriptApp: React.FC<{ geminiApiKey: string, openaiApiKey: string, selectedAIModel: string, onGoBack: () => void }> = ({ geminiApiKey, openaiApiKey, selectedAIModel, onGoBack }) => {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [idea, setIdea] = useState('');
  const [duration, setDuration] = useState<string>('1');
  const [style, setStyle] = useState<FilmStyle>(FilmStyle.CINEMATIC);
  const [costumeMode, setCostumeMode] = useState<CostumeMode>(CostumeMode.ORIGINAL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeLang, setActiveLang] = useState<'vi' | 'en'>('vi');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setImageData((reader.result as string).split(',')[1]);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await generateScript({ idea, duration: parseFloat(duration), style, costumeMode, imageData: imageData || undefined, imageMimeType: imageMimeType || undefined }, geminiApiKey, openaiApiKey, selectedAIModel);
      setContent(res);
    } catch (err) {}
    setIsLoading(false);
  };

  return (
    <div className="p-4 flex flex-col lg:flex-row gap-8 bg-slate-900 min-h-screen text-white">
      <div className="lg:w-1/3 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
        <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2"><Icons.VideoCamera className="w-6 h-6" /> CineScript AI</h2>
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} className="w-full bg-slate-900 p-3 rounded mb-4" placeholder="Nhập ý tưởng kịch bản..." rows={5} />
        <div className="mb-4">
          <label className="block text-xs font-bold text-cyan-400 uppercase mb-2">Ảnh mẫu</label>
          <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border border-dashed border-slate-600 rounded flex items-center justify-center cursor-pointer overflow-hidden">
            {previewImage ? <img src={previewImage} className="object-cover w-full h-full" /> : <span>Tải ảnh lên</span>}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
        </div>
        <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-900 p-2 rounded mb-6" placeholder="Phút" />
        <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-cyan-600 py-3 rounded font-bold uppercase hover:bg-cyan-500">{isLoading ? "Đang tạo..." : "Tạo Kịch Bản"}</button>
      </div>
      <div className="lg:w-2/3">
        {content ? (
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 min-h-full">
            <h1 className="text-2xl font-bold text-center mb-8 text-cyan-400 uppercase tracking-widest">{content.title[activeLang]}</h1>
            <div className="space-y-6">
              {content.script.map((scene, i) => (
                <div key={i} className="bg-slate-900 p-4 rounded border border-slate-700">
                  <span className="text-cyan-500 font-bold mb-2 block">Cảnh {i+1}</span>
                  <p className="text-slate-300 text-sm font-mono whitespace-pre-wrap">{scene[activeLang]}</p>
                </div>
              ))}
            </div>
          </div>
        ) : <div className="text-slate-600 text-center mt-20">Kịch bản sẽ hiện ở đây</div>}
      </div>
    </div>
  );
};

export default CineScriptApp;

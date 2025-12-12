import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// ==========================================
// 1. TYPES & ENUMS
// ==========================================

export enum FilmStyle {
  CINEMATIC = 'Điện ảnh (Cinematic)',
  ANIMATION = 'Hoạt hình (Animation)'
}

export enum DialogueOption {
  NO_DIALOGUE = 'no_dialogue',
  WITH_DIALOGUE = 'with_dialogue'
}

export interface CharacterProfile {
  id: string;
  name: string;
  image: string | null; // Data URL (base64)
}

export interface PromptItem {
  vi: string;
  en: string;
}

export interface GeneratedContent {
  title: PromptItem;
  context: PromptItem[];
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
  Duplicate: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>,
  Lock: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  Unlock: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
};

// ==========================================
// 3. UTILS & AI SERVICES
// ==========================================

const cleanJsonString = (str: string): string => {
    // Remove markdown code blocks if present
    return str.replace(/```json\n?|```/g, '').trim();
};

const buildBasePrompt = (idea: string, duration: number, style: FilmStyle, dialogue: DialogueOption, sceneCount: number, randomSeed: string, characters: CharacterProfile[]) => {

    const dialogueInstruction = dialogue === DialogueOption.WITH_DIALOGUE
        ? `
       - CÓ THOẠI:
         + Bắt buộc phải có lời thoại/dẫn chuyện (voiceover) cho nhân vật trong prompt.
         + Định dạng: Phải kết thúc prompt bằng "Audio: [Tên nhân vật/Dẫn chuyện]: '[Lời thoại bằng TIẾNG VIỆT]'".
         + VD: "Audio: Dẫn chuyện: 'Thế giới đã thay đổi...'".`
        : `
       - KHÔNG THOẠI:
         + TUYỆT ĐỐI không được thêm lời thoại hay tag "Audio:".
         + Prompt chỉ tập trung vào hình ảnh và âm thanh (tiếng động, nhạc nền).
         + VD: "Sound of wind howling, tense background music".`;

    const characterInstructions = characters.map((char, index) => `
       - NHÂN VẬT ${index + 1} (${char.name}):
         + ĐÂY LÀ NHÂN VẬT THAM CHIẾU TỪ ẢNH.
         + BẮT BUỘC: Giữ nguyên khuôn mặt, tóc, dáng người từ ảnh mẫu.
         + BẮT BUỘC: Khi ${char.name} xuất hiện trong kịch bản, phải mô tả lại đầy đủ trang phục của nhân vật này.
    `).join('');

    return `
    Bạn là một chuyên gia viết PROMPT tạo video AI (AI Video Prompt Engineer) theo trường phái "Siêu Thực Chi Tiết" (Hyper-Detailed Realism).
    Nhiệm vụ: Chuyển đổi ý tưởng thành danh sách các PROMPT chi tiết đến mức ám ảnh (obsessively detailed).

    THÔNG TIN ĐẦU VÀO:
    - Ý tưởng: "${idea}"
    - Thời lượng: ${duration} phút.
    - Quy ước: 1 Prompt = 1 Cảnh (Scene) = 8 giây.
    - TỔNG SỐ PROMPT CẦN TẠO: ${sceneCount} PROMPT (BẮT BUỘC CHÍNH XÁC).
    - Phong cách: ${style}
    - Chế độ thoại: ${dialogue === DialogueOption.WITH_DIALOGUE ? 'Có thoại (Tiếng Việt)' : 'Không thoại'}
    - Random Seed: "${randomSeed}"

    QUY TẮC TUYỆT ĐỐI (ABSOLUTE RULES) - KHÔNG ĐƯỢC PHÉP SAI PHẠM:
    
    1. KIỂM SOÁT SỐ LƯỢNG & NGÔN NGỮ:
       - Trả về đúng ${sceneCount} prompts trong mảng 'script'.
       - Mỗi mục trong JSON phải có 2 phiên bản: "vi" (Tiếng Việt) và "en" (English).
    
    2. NGUYÊN TẮC "PROMPT NGUYÊN TỬ" (ATOMIC PROMPTING):
       - Mỗi Prompt phải độc lập hoàn toàn.
       - CẤM viết tắt, CẤM lược bỏ.
       - CẤM dùng đại từ thay thế (cô ấy, anh ấy, nó).
       - CẤM tham chiếu (như cảnh trước).

    3. CHI TIẾT ĐẾN TỪNG MM (EXTREME DETAIL MAPPING) - QUAN TRỌNG NHẤT:
       - ĐÂY LÀ YÊU CẦU QUAN TRỌNG NHẤT: MỌI DANH TỪ PHẢI KÈM MÔ TẢ.
       
       A. VẬT DỤNG (OBJECTS):
          - KHÔNG ĐƯỢC VIẾT: "cái bàn", "chiếc xe", "cây kiếm".
          - PHẢI VIẾT: "cái bàn gỗ sồi tròn màu nâu sẫm có vết xước", "chiếc xe thể thao màu đỏ rực với vành xe mạ crôm sáng bóng", "cây kiếm thép dài rỉ sét với chuôi kiếm bọc da đen".
          - LUÔN LUÔN mô tả: HÌNH DÁNG + MÀU SẮC + CHẤT LIỆU.

       B. BỐI CẢNH (ENVIRONMENT):
          - KHÔNG ĐƯỢC VIẾT: "trong phòng", "ngoài đường".
          - PHẢI VIẾT: "trong căn phòng khách tồi tàn với giấy dán tường hoa văn màu vàng bong tróc và sàn gỗ tối màu đầy bụi", "trên con đường nhựa ướt đẫm nước mưa phản chiếu ánh đèn neon xanh đỏ từ các biển hiệu".
          - Mọi chi tiết nền (tường, sàn, bầu trời, ánh sáng) phải được mô tả rõ ràng trong TỪNG PROMPT.

       C. NHÂN VẬT & TRANG PHỤC (CHARACTERS & CLOTHES):
          ${characterInstructions}
          - PHẢI mô tả lại toàn bộ trang phục trong MỌI CẢNH.
          - Ví dụ: Cảnh 1 mô tả "áo khoác da màu đen cổ lông", thì Cảnh 10 vẫn phải viết "áo khoác da màu đen cổ lông", KHÔNG được viết "áo khoác của anh ấy".

    4. XỬ LÝ LỜI THOẠI:
       ${dialogueInstruction}

    5. PHONG CÁCH (STYLE):
       - Phong cách phim: "${style}".
       - BẮT BUỘC chèn từ khóa phong cách vào MỌI prompt.
       - Cinematic: "cinematic lighting, photorealistic, 8k, highly detailed, depth of field, movie still, color graded".
       - Animation: "3d animation, pixar style, cgi render, vibrant colors, unreal engine 5 render".

    HÃY TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON.
    `;
};

const generateScript = async (idea: string, duration: number, style: FilmStyle, dialogue: DialogueOption, characters: CharacterProfile[], geminiApiKey: string, openaiApiKey: string, selectedModel: string): Promise<GeneratedContent> => {
    const totalSeconds = duration * 60;
    const sceneCount = Math.ceil(totalSeconds / 8);
    const randomSeed = Math.random().toString(36).substring(7) + Date.now();
    
    const basePrompt = buildBasePrompt(idea, duration, style, dialogue, sceneCount, randomSeed, characters);
    let finalError: unknown;
    let result: GeneratedContent | null = null;

    // 1. Try OpenAI
    if ((selectedModel === 'openai' || (selectedModel === 'auto' && openaiApiKey))) {
        try {
            if (!openaiApiKey) throw new Error("OpenAI API Key chưa được cài đặt.");
            const openAIPrompt = `${basePrompt}\nIMPORTANT: You MUST return a valid JSON object matching the requested structure EXACTLY. DO NOT output Markdown blocks. Just raw JSON.`;
            const messages: any[] = [{ role: "user", content: [{ type: "text", text: openAIPrompt }] }];
            characters.forEach(char => {
                if(char.image) messages[0].content.push({ type: "image_url", image_url: { url: char.image } });
            });

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: "gpt-4o", messages: messages, response_format: { type: "json_object" }, temperature: 0.9 })
            });

            if (!response.ok) throw new Error(`OpenAI Error: ${await response.text()}`);
            const apiResult = await response.json();
            result = JSON.parse(apiResult.choices[0].message.content) as GeneratedContent;
        } catch (e) {
            console.error("OpenAI failed", e);
            if (selectedModel === 'openai') throw e;
            finalError = e;
        }
    }

    // 2. Try Gemini
    if (!result && (selectedModel === 'gemini' || (selectedModel === 'auto' && geminiApiKey))) {
        try {
            if (!geminiApiKey) throw new Error("Gemini API Key chưa được cài đặt.");
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] },
                    context: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
                    characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
                    script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } },
                },
                required: ["title", "context", "characters", "script"],
            };

            const parts: any[] = [{ text: basePrompt }];
            characters.forEach(char => {
                if(char.image) {
                    const mimeTypeMatch = char.image.match(/^data:(image\/[a-z]+);base64,/);
                    if(mimeTypeMatch) {
                        const base64Data = char.image.substring(mimeTypeMatch[0].length);
                        parts.push({ inlineData: { data: base64Data, mimeType: mimeTypeMatch[1] } });
                    }
                }
            });

            const response = await ai.models.generateContent({
                // Fix: Use a more powerful model for complex scriptwriting tasks.
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: parts }],
                config: { temperature: 0.9, responseMimeType: "application/json", responseSchema: responseSchema }
            });
            result = JSON.parse(cleanJsonString(response.text || "{}")) as GeneratedContent;
        } catch (geminiError) {
            console.error("Gemini Failed:", geminiError);
            if (selectedModel === 'gemini') throw geminiError;
            finalError = geminiError;
        }
    }

    if (result) return result;
    throw finalError || new Error("Không thể tạo kịch bản từ bất kỳ API nào.");
};

const generateSingleScene = async (instruction: string, style: FilmStyle, geminiApiKey: string, openaiApiKey: string, selectedModel: string): Promise<PromptItem> => {
    const prompt = `
      Bạn là chuyên gia viết Prompt Video AI theo trường phái CHI TIẾT CỰC ĐOAN (Extreme Detail).
      Nhiệm vụ: Viết MỘT PROMPT DUY NHẤT dựa trên gợi ý: "${instruction}".
      Phong cách: ${style}
      
      LUẬT BẤT KHẢ KHÁNG (ABSOLUTE RULES):
      1. KHÔNG BAO GIỜ được viết ngắn gọn. Phải mô tả trọn vẹn hình ảnh.
      2. NẾU người dùng gợi ý về một nhân vật/đối tượng cụ thể, BẠN PHẢI TỰ ĐỘNG THÊM CÁC CHI TIẾT MÔ TẢ:
         - Vật dụng: Phải có MÀU SẮC, CHẤT LIỆU, HÌNH DÁNG (VD: bàn gỗ sồi tròn màu nâu).
         - Trang phục: Phải có MÀU SẮC, KIỂU DÁNG (VD: áo khoác da đen cũ kỹ).
         - Bối cảnh: Phải có ÁNH SÁNG, MÀU SẮC TƯỜNG/SÀN (VD: hẻm tối tường gạch ẩm ướt).
      3. CẤM dùng đại từ (anh ấy, cô ấy). Phải dùng danh từ cụ thể + tính từ mô tả.
      4. BẮT BUỘC chèn từ khóa phong cách "${style}" vào prompt (Ví dụ: cinematic lighting, 8k...).
      5. Prompt phải độc lập hoàn toàn, TUYỆT ĐỐI KHÔNG BỎ SÓT CHI TIẾT NÀO.
      
      Trả về JSON:
      {
        "vi": "Prompt Tiếng Việt ĐẦY ĐỦ CHI TIẾT (Màu sắc, Chất liệu, Hình dáng)...",
        "en": "Full Detailed English Prompt (Color, Material, Shape)..."
      }
    `;

    let result: PromptItem | null = null;
    let finalError;

    // 1. Try OpenAI
    if ((selectedModel === 'openai' || (selectedModel === 'auto' && openaiApiKey))) {
        try {
            if (!openaiApiKey) throw new Error("OpenAI API Key chưa được cài đặt.");
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt + "\nRETURN JSON ONLY: { \"vi\": \"...\", \"en\": \"...\" }" }], response_format: { type: "json_object" }, temperature: 0.9 })
            });
            const apiResult = await response.json();
            result = JSON.parse(apiResult.choices[0].message.content) as PromptItem;
        } catch (e) {
            if (selectedModel === 'openai') throw e;
            finalError = e;
        }
    }

    // 2. Try Gemini
    if (!result && (selectedModel === 'gemini' || (selectedModel === 'auto' && geminiApiKey))) {
        try {
            if (!geminiApiKey) throw new Error("Gemini API Key chưa được cài đặt.");
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const response = await ai.models.generateContent({
                // Fix: Use a more powerful model for complex scriptwriting tasks.
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { temperature: 0.9, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } }, required: ["vi", "en"] } }
            });
            result = JSON.parse(cleanJsonString(response.text || "{}")) as PromptItem;
        } catch (err) {
            if (selectedModel === 'gemini') throw err;
            finalError = err;
        }
    }

    if (result) return result;
    throw finalError || new Error("Không thể tạo cảnh từ bất kỳ API nào.");
};

// ==========================================
// 4. COMPONENTS
// ==========================================

const PasswordProtection = ({ onUnlock, onClose }: { onUnlock: () => void, onClose: () => void }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'generateprompt') {
            onUnlock();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 p-8 rounded-2xl border border-cyan-500/30 shadow-2xl max-w-md w-full flex flex-col items-center relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-cyan-600/5 rotate-45 pointer-events-none" />
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6 border border-slate-600 shadow-inner">
                    <Icons.Lock className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2 uppercase tracking-wide text-center">
                    Bảo Mật Ứng Dụng
                </h2>
                <p className="text-slate-400 text-sm mb-8 text-center px-4">
                    Ứng dụng này yêu cầu mã truy cập đặc biệt để sử dụng.
                </p>
                <form onSubmit={handleUnlock} className="w-full space-y-4 relative z-10">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mã truy cập..."
                            className={`w-full bg-slate-900 border ${error ? 'border-red-500 animate-shake' : 'border-slate-600 focus:border-cyan-500'} rounded-lg py-3 px-4 text-center text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 font-mono tracking-widest`}
                            autoFocus
                        />
                        {error && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"><Icons.XMark className="w-5 h-5"/></span>}
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform active:scale-95 shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 uppercase tracking-wide">
                        <Icons.Unlock className="w-5 h-5" />
                        Mở Khóa
                    </button>
                </form>
            </div>
        </div>
    );
};

const SceneInputForm = ({ 
  initialText = '', placeholder, submitLabel, onCancel, onSubmit, isProcessing 
}: { 
  initialText?: string, placeholder: string, submitLabel: string, onCancel: () => void, onSubmit: (text: string) => void, isProcessing: boolean 
}) => {
  const [text, setText] = useState(initialText);
  return (
    <div className="relative z-50 animate-fade-in my-3 bg-slate-800 border border-cyan-500/50 rounded-lg p-3 shadow-2xl">
      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-28 bg-slate-900 text-slate-200 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm mb-3 z-50 relative resize-none leading-relaxed"
        placeholder={placeholder}
        disabled={isProcessing}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors" disabled={isProcessing}>Hủy</button>
        <button onClick={(e) => { e.stopPropagation(); onSubmit(text); }} disabled={isProcessing || !text.trim()} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2 transition-transform active:scale-95">
          {isProcessing && <Icons.ArrowPath className="w-3 h-3 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

// Fix: Changed to named export
export const GeneratePromptApp: React.FC<{ geminiApiKey: string, openaiApiKey: string, selectedAIModel: string, onGoBack: () => void }> = ({ geminiApiKey, openaiApiKey, selectedAIModel, onGoBack }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [idea, setIdea] = useState('');
  const [duration, setDuration] = useState<string>('1');
  const [style, setStyle] = useState<FilmStyle>(FilmStyle.CINEMATIC);
  const [dialogue, setDialogue] = useState<DialogueOption>(DialogueOption.NO_DIALOGUE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'vi' | 'en'>('vi');
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  
  // Character State
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  
  // Edit/Add State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null);
  const [isProcessingItem, setIsProcessingItem] = useState<boolean>(false);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addCharacter = () => {
    setCharacters(prev => [...prev, { id: `char_${Date.now()}`, name: `Nhân vật ${prev.length + 1}`, image: null }]);
  };

  const handleCharacterImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCharacters(prev => prev.map((char, i) => i === index ? { ...char, image: result } : char));
    };
    reader.readAsDataURL(file);
  };

  const updateCharacterName = (index: number, newName: string) => {
    setCharacters(prev => prev.map((char, i) => i === index ? { ...char, name: newName } : char));
  };
  
  const removeCharacter = (index: number) => {
    setCharacters(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!geminiApiKey && !openaiApiKey) { setError("Vui lòng cài đặt ít nhất một API Key."); return; }
    if (!idea.trim()) return;
    const durationNum = parseFloat(duration);
    if (isNaN(durationNum) || durationNum <= 0) return;

    setIsLoading(true); setError(null); setContent(null);
    try {
      const result = await generateScript(idea, durationNum, style, dialogue, characters, geminiApiKey, openaiApiKey, selectedAIModel);
      setContent(result);
    } catch (err: any) {
      setError(err.message || "Lỗi tạo kịch bản.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOne = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIds(prev => new Set(prev).add(id));
  };

  const handleCopyAll = (items: PromptItem[]) => {
    const text = items.map(item => item[activeLang]).join('\n\n');
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép toàn bộ (${activeLang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})!`);
  };

  const handleRegenerateScene = async (instruction: string, index: number) => {
    if (!instruction.trim() || !content) return;
    setIsProcessingItem(true);
    try {
        const newItem = await generateSingleScene(instruction, style, geminiApiKey, openaiApiKey, selectedAIModel);
        const newScript = [...content.script];
        newScript[index] = newItem;
        setContent({ ...content, script: newScript });
        setEditingIndex(null);
    } catch (e) { alert("Lỗi khi tạo lại cảnh."); } 
    finally { setIsProcessingItem(false); }
  };

  const handleAddScene = async (instruction: string, indexToInsertAfter: number) => {
      if (!instruction.trim() || !content) return;
      setIsProcessingItem(true);
      try {
          const newItem = await generateSingleScene(instruction, style, geminiApiKey, openaiApiKey, selectedAIModel);
          const newScript = [...content.script];
          newScript.splice(indexToInsertAfter + 1, 0, newItem);
          setContent({ ...content, script: newScript });
          setAddingAtIndex(null);
      } catch (e) { alert("Lỗi khi thêm cảnh mới."); } 
      finally { setIsProcessingItem(false); }
  };

  const handleDownloadScript = () => {
    if (!content) return;
    const scriptText = content.script.map((item, index) => `Scene ${index + 1}: ${item[activeLang]}`).join('\n\n');
    const safeTitle = content.title.vi.replace(/[^a-zA-Z0-9\u00C0-\u1EF9\s]/g, '').trim().substring(0, 100);
    const element = document.createElement("a");
    const file = new Blob([scriptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${safeTitle}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="relative w-full h-full p-4 flex flex-col lg:flex-row gap-8 bg-slate-900 text-slate-200 font-sans">
      
      {!isUnlocked && <PasswordProtection onUnlock={() => setIsUnlocked(true)} onClose={onGoBack} />}

      <div className="w-full lg:w-1/3 flex-shrink-0 space-y-6">
         <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2 font-serif uppercase tracking-widest"><Icons.Pencil className="w-5 h-5" /> AI Screenwriter</h2>
            <div>
                <label className="block text-cyan-400 text-xs font-bold mb-2 uppercase tracking-wider">Ý tưởng kịch bản</label>
                <textarea className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none focus:ring-2 focus:ring-cyan-500/20 transition-all" placeholder="Nhập nội dung phim..." value={idea} onChange={(e) => setIdea(e.target.value)} disabled={isLoading} />
            </div>
            {/* ... form content ... */}
         </div>
      </div>

      <div className="w-full lg:w-2/3 flex-shrink-0 h-full overflow-hidden relative flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700">
         {/* ... results content ... */}
      </div>
    </div>
  );
};


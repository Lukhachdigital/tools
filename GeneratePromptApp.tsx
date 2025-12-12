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
  Trash: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  UserPlus: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  DocumentText: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0h2.25m-2.25 3h2.25M3.75 6v8.25A2.25 2.25 0 006 16.5h2.25m-2.25 0H9m-3 0v3m0 3h12a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018 4.5H6A2.25 2.25 0 003.75 6z" /></svg>,
  XCircle: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  PlayCircle: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>,
  SpeakerXMark: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>,
  ChatBubble: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
  Lock: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  Unlock: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  Map: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  UserGroup: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Film: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0121 18.375m-16.5-6.375h1.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A1.125 1.125 0 014.5 12zm16.5-6.375h-1.5a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5a1.125 1.125 0 001.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125zm-16.5 0h1.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5A1.125 1.125 0 014.5 6v-1.5a1.125 1.125 0 011.125-1.125z" /></svg>,
  PencilSquare: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  Clipboard: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>,
  Check: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  PlusCircle: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ArrowDownTray: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  User: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  ArrowPath: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
  Duplicate: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
};

// ==========================================
// 3. SERVICE LOGIC (Integrated)
// ==========================================

const base64ToPart = (base64String: string) => {
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length < 3) throw new Error("Invalid base64 image format");
    return { inlineData: { mimeType: matches[1], data: matches[2] } };
};

const getStyleInstructions = (style: FilmStyle) => {
    if (style === FilmStyle.CINEMATIC) {
        return `YÊU CẦU VỀ PHONG CÁCH ĐIỆN ẢNH: Hình ảnh phải như cắt ra từ phim tài liệu National Geographic hoặc phim tâm lý xã hội (Drama). Tôn trọng sự không hoàn hảo: Da có nếp nhăn, quần áo có nếp gấp bụi bặm. CẤM CÔNG NGHỆ: Loại bỏ hoàn toàn các từ khóa: "futuristic", "cyberpunk", "neon", "mechanical" trừ khi kịch bản yêu cầu.`;
    }
    return `YÊU CẦU VỀ PHONG CÁCH HOẠT HÌNH: Tạo hình ảnh 3D chất lượng cao, phong cách Pixar/Disney hoặc Dreamworks. Ánh sáng rực rỡ, màu sắc tươi sáng, biểu cảm nhân vật cường điệu hóa.`;
};

const getStrictRules = (dialogueOption: DialogueOption) => `
    NGUYÊN TẮC "PROMPT NGUYÊN TỬ": Mỗi Prompt độc lập hoàn toàn. CẤM viết tắt, tham chiếu.
    TÊN NHÂN VẬT: Dùng tên gợi hình (Ví dụ: "Chú Chó Chăn Cừu" thay vì "Chó A").
    ÂM THANH: Mọi prompt phải có mô tả Audio/SFX.
    BỐI CẢNH TUYỆT ĐỐI: Phải viết lại chi tiết bối cảnh trong TỪNG prompt.
    QUY TẮC THOẠI: ${dialogueOption === DialogueOption.NO_DIALOGUE ? '- KHÔNG THOẠI. Nhân vật ngậm miệng (closed mouth).' : '- CÓ THOẠI. Nhân vật có thể mở miệng/nói.'}
    CHI TIẾT VẬT DỤNG: Mô tả màu sắc, chất liệu cụ thể.
    DANH SÁCH NHÂN VẬT: Trả về "Tên: Mô tả... (trên nền trắng)".
    TRONG KỊCH BẢN: Hòa nhập Tên và Mô tả thành câu tự nhiên. Ví dụ: "Một chú Chó Chăn Cừu lông xù đang chạy..."
`;

const generateScriptFromList = async (
    lines: string[], 
    style: FilmStyle, 
    dialogueOption: DialogueOption,
    characters: CharacterProfile[],
    geminiKey: string,
    openaiKey: string,
    selectedModel: string
): Promise<GeneratedContent> => {
    
    if (!geminiKey && !openaiKey) throw new Error("Vui lòng nhập API Key.");

    const imageParts: any[] = [];
    let imageInstructions = "";
    characters.filter(c => c.image).forEach((char, index) => {
        if (char.image) {
            imageParts.push(base64ToPart(char.image));
            imageInstructions += `   - REFERENCE IMAGE #${index + 1} IS CHARACTER: "${char.name}"\n`;
        }
    });

    if (imageInstructions) {
        imageInstructions = `DỮ LIỆU HÌNH ẢNH THAM CHIẾU:\n${imageInstructions}\nYÊU CẦU: Nếu tên nhân vật trùng khớp, BẠN PHẢI MÔ TẢ TRANG PHỤC VÀ NGOẠI HÌNH GIỐNG HỆT TRONG ẢNH.`;
    }

    const styleKeywords = style === FilmStyle.CINEMATIC ? "" : `${style}, 3d render, pixar style, 8k, masterpiece`;

    const promptText = `
    Bạn là chuyên gia viết Prompt Video AI chuyên nghiệp (Hollywood Screenwriter).
    Nhiệm vụ: Dựa vào danh sách các dòng mô tả cảnh bên dưới, hãy tạo ra bộ Prompt chi tiết cho từng cảnh.
    
    INPUT - DANH SÁCH CẢNH:
    ${lines.map((line, i) => `[Cảnh ${i + 1}]: ${line}`).join('\n')}

    PHONG CÁCH CHỦ ĐẠO: ${style}
    CHẾ ĐỘ THOẠI: ${dialogueOption === DialogueOption.NO_DIALOGUE ? 'KHÔNG THOẠI (NO DIALOGUE)' : 'CÓ THOẠI (WITH DIALOGUE)'}

    ${imageInstructions}
    ${getStyleInstructions(style)}

    YÊU CẦU XỬ LÝ:
    1. PHÂN TÍCH NHẤT QUÁN: Xác định nhân vật và TÊN GỌI. Lặp lại chi tiết ngoại hình trong MỌI prompt script.
    2. VIẾT PROMPT CHI TIẾT:
       ${getStrictRules(dialogueOption)}
    ${styleKeywords ? `3. STYLE KEYWORDS (BẮT BUỘC Ở ĐẦU PROMPT): "${styleKeywords}..."` : ''}

    TRẢ VỀ JSON:
    {
       "title": { "vi": "...", "en": "..." },
       "context": [ { "vi": "...", "en": "..." } ],
       "characters": [ { "vi": "Tên: Mô tả... (trên nền trắng)", "en": "Name: Description... (isolated on white background)" } ],
       "script": [ 
          { "vi": "Prompt chi tiết cảnh 1...", "en": "Detailed prompt scene 1..." },
          ...
       ]
    }`;

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

    // 1. Try OpenAI
    if ((selectedModel === 'openai' || (selectedModel === 'auto' && openaiKey))) {
        try {
            if (!openaiKey) throw new Error("OpenAI API Key chưa được cài đặt.");
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: promptText }], // Note: OpenAI doesn't support the images via text prompt this way, only text. Image support requires separate structure which we skip here for simplicity or handle if text-only fallback.
                    response_format: { type: "json_object" },
                    temperature: 0.9
                })
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content) as GeneratedContent;
        } catch (e) {
            if (selectedModel === 'openai') throw e;
        }
    }

    // 2. Try Gemini
    if ((selectedModel === 'gemini' || (selectedModel === 'auto' && geminiKey))) {
        try {
            if (!geminiKey) throw new Error("Gemini API Key chưa được cài đặt.");
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const parts = [{ text: promptText }, ...imageParts];
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts }],
                config: { temperature: 0.9, responseMimeType: "application/json", responseSchema }
            });
            return JSON.parse(response.text || "{}") as GeneratedContent;
        } catch (e) {
            throw e;
        }
    }
    
    throw new Error("Không thể tạo nội dung. Vui lòng kiểm tra API Key.");
};

const generateSingleScene = async (
    instruction: string, 
    style: FilmStyle, 
    dialogueOption: DialogueOption,
    contextData: GeneratedContent | null,
    geminiKey: string,
    openaiKey: string,
    selectedModel: string
): Promise<PromptItem> => {
    
    let contextPrompt = "";
    if (contextData) {
        const characters = contextData.characters.map(c => `- ${c.vi}`).join("\n");
        const contexts = contextData.context.map(c => `- ${c.vi}`).join("\n");
        contextPrompt = `THÔNG TIN NHẤT QUÁN:\n1. NHÂN VẬT: ${characters}\n2. BỐI CẢNH: ${contexts}\n(Yêu cầu: Dùng đúng tên và mô tả lại chi tiết).`;
    }

    const styleKeywords = style === FilmStyle.CINEMATIC ? "" : `${style}, 3d render, pixar style, 8k`;
    const prompt = `
      Bạn là chuyên gia viết Prompt Video AI. Viết MỘT PROMPT DUY NHẤT dựa trên ý tưởng: "${instruction}".
      Phong cách: ${style}. Chế độ: ${dialogueOption === DialogueOption.NO_DIALOGUE ? 'KHÔNG THOẠI' : 'CÓ THOẠI'}.
      ${contextPrompt}
      ${getStyleInstructions(style)}
      YÊU CẦU CHI TIẾT: ${getStrictRules(dialogueOption)}
      ${styleKeywords ? `STYLE: Bắt đầu bằng "${styleKeywords}..."` : ''}
      Trả về JSON: { "vi": "...", "en": "..." }`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: { vi: { type: Type.STRING }, en: { type: Type.STRING } },
        required: ["vi", "en"]
    };

    // 1. Try OpenAI
    if ((selectedModel === 'openai' || (selectedModel === 'auto' && openaiKey))) {
        try {
            if (!openaiKey) throw new Error("OpenAI Key missing");
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: prompt + "\nRETURN JSON ONLY" }],
                    response_format: { type: "json_object" },
                    temperature: 0.9
                })
            });
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content) as PromptItem;
        } catch (e) { if (selectedModel === 'openai') throw e; }
    }

    // 2. Try Gemini
    if ((selectedModel === 'gemini' || (selectedModel === 'auto' && geminiKey))) {
        try {
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { temperature: 0.9, responseMimeType: "application/json", responseSchema }
            });
            return JSON.parse(response.text || "{}") as PromptItem;
        } catch (e) { throw e; }
    }

    throw new Error("API Error");
};

// ==========================================
// 4. SUB-COMPONENTS
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-slate-800 p-8 rounded-2xl border border-cyan-500/30 shadow-2xl max-w-md w-full flex flex-col items-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-cyan-600/5 rotate-45 pointer-events-none" />
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6 border border-slate-600 shadow-inner">
                    <Icons.Lock className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2 uppercase tracking-wide text-center">Bảo Mật Ứng Dụng</h2>
                <p className="text-slate-400 text-sm mb-8 text-center px-4">Nhập mã truy cập để sử dụng ứng dụng Generate Prompt.</p>
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
                        <Icons.Unlock className="w-5 h-5" /> Mở Khóa
                    </button>
                </form>
            </div>
        </div>
    );
};

const SceneInputForm = ({ initialText = '', placeholder, submitLabel, onCancel, onSubmit, isProcessing, autoFocus = true }: any) => {
  const [text, setText] = useState(initialText);
  return (
    <div className="relative z-50 animate-fade-in my-3 bg-slate-800 border border-cyan-500/50 rounded-lg p-3 shadow-2xl">
      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`w-full h-28 bg-slate-900 text-gray-100 p-3 rounded border focus:outline-none text-sm mb-3 z-50 relative resize-none leading-relaxed ${isProcessing ? 'border-cyan-500/50 opacity-70 cursor-not-allowed' : 'border-slate-700 focus:border-cyan-500'}`}
        placeholder={placeholder}
        disabled={isProcessing}
        autoFocus={autoFocus && !isProcessing}
      />
      <div className="flex justify-end gap-2">
        {!isProcessing && <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors">Hủy</button>}
        <button onClick={(e) => { e.stopPropagation(); onSubmit(text); }} disabled={isProcessing || !text.trim()} className={`px-4 py-1.5 rounded flex items-center gap-2 transition-transform text-xs font-bold uppercase ${isProcessing ? 'bg-cyan-900/50 text-cyan-200 cursor-wait' : 'bg-cyan-600 hover:bg-cyan-500 text-slate-900 active:scale-95'}`}>
          {isProcessing ? <><Icons.ArrowPath className="w-3 h-3 animate-spin" /><span>Đang viết...</span></> : submitLabel}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN APP COMPONENT
// ==========================================

export const GeneratePromptApp: React.FC<{ geminiApiKey: string, openaiApiKey: string, selectedAIModel: string, onGoBack: () => void }> = ({ geminiApiKey, openaiApiKey, selectedAIModel, onGoBack }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [content, setContent] = useState<GeneratedContent>({ title: { vi: "Dự Án Mới", en: "New Project" }, context: [], characters: [], script: [] });
  const [currentStyle, setCurrentStyle] = useState<FilmStyle>(FilmStyle.CINEMATIC);
  const [currentDialogue, setCurrentDialogue] = useState<DialogueOption>(DialogueOption.NO_DIALOGUE);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{name: string, lines: string[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Output State
  const [activeLang, setActiveLang] = useState<'vi' | 'en'>('vi');
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null);
  const [isProcessingItem, setIsProcessingItem] = useState<boolean>(false);

  // --- Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "text/plain") { alert("Vui lòng chọn file .txt"); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length > 0) setSelectedFile({ name: file.name, lines });
        else alert("File không có nội dung!");
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
      if (!selectedFile) return;
      setIsLoading(true); setError(null);
      try {
          const result = await generateScriptFromList(selectedFile.lines, currentStyle, currentDialogue, characters, geminiApiKey, openaiApiKey, selectedAIModel);
          setContent(result);
      } catch (err: any) {
          setError(err.message || "Lỗi xử lý. Vui lòng kiểm tra API Key.");
      } finally { setIsLoading(false); }
  };

  const handleCopyOne = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIds(prev => new Set(prev).add(id));
  };

  const handleCopyAll = (items: PromptItem[], lang: 'vi' | 'en') => {
    const text = items.map(item => item[lang]).join('\n\n');
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép toàn bộ (${lang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})!`);
  };

  const handleRegenerateScene = async (text: string, index: number) => {
      if(!text.trim()) return;
      setIsProcessingItem(true);
      try {
          const newItem = await generateSingleScene(text, currentStyle, currentDialogue, content, geminiApiKey, openaiApiKey, selectedAIModel);
          const newScript = [...content.script];
          newScript[index] = newItem;
          setContent({ ...content, script: newScript });
          setEditingIndex(null);
      } catch (e) { alert("Lỗi tạo lại cảnh."); } finally { setIsProcessingItem(false); }
  };

  const handleAddScene = async (text: string, indexToInsertAfter: number) => {
      if(!text.trim()) return;
      setIsProcessingItem(true);
      try {
          const newItem = await generateSingleScene(text, currentStyle, currentDialogue, content, geminiApiKey, openaiApiKey, selectedAIModel);
          const newScript = [...content.script];
          newScript.splice(indexToInsertAfter + 1, 0, newItem);
          setContent({ ...content, script: newScript });
          setAddingAtIndex(null);
      } catch (e) { alert("Lỗi thêm cảnh."); } finally { setIsProcessingItem(false); }
  };

  // Character Handlers
  const handleAddCharacter = () => setCharacters([...characters, { id: Date.now().toString(), name: `NV ${characters.length + 1}`, image: null }]);
  const handleRemoveCharacter = (id: string) => setCharacters(characters.filter(c => c.id !== id));
  const handleCharChange = (id: string, field: keyof CharacterProfile, value: any) => setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleCharChange(id, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const PromptSection = ({ title, icon: Icon, items, idPrefix, colorClass, borderColor, isScript = false }: any) => {
      if (!isScript && (!items || items.length === 0)) return null;
      return (
          <div className="mb-10 w-full">
              <div className={`flex items-center gap-3 mb-6 pb-3 border-b ${borderColor}`}>
                  <Icon className={`w-6 h-6 ${colorClass}`} />
                  <h2 className={`text-xl font-bold uppercase tracking-wider ${colorClass}`}>{title}</h2>
                  <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{items ? items.length : 0} Prompt</span>
                  {items && items.length > 0 && (
                      <button onClick={() => handleCopyAll(items, activeLang)} className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md transition-all group shadow-sm">
                          <Icons.Duplicate className="w-5 h-5 text-slate-400 group-hover:text-white" />
                          <span className="text-xs font-bold uppercase text-slate-300 group-hover:text-white">Copy All</span>
                      </button>
                  )}
              </div>
              <div className="space-y-4">
                  {isScript && items.length === 0 && (
                      <div className="w-full">
                          <div className="mb-2"><span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/40 border border-slate-700/50 ${colorClass}`}>SCENE 1 (NEW)</span></div>
                          <SceneInputForm placeholder="Nhập gợi ý cho Cảnh 1..." submitLabel="Tạo Prompt Đầu Tiên" onCancel={() => {}} onSubmit={(text: string) => handleAddScene(text, -1)} isProcessing={isProcessingItem} />
                      </div>
                  )}
                  {isScript && items.length > 0 && (
                      <div className="relative group/divider py-2 flex flex-col items-center justify-center z-10">
                          <button onClick={() => setAddingAtIndex(-1)} disabled={isProcessingItem} className="opacity-0 group-hover/divider:opacity-100 flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-xs text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-all z-10 mb-2"><Icons.PlusCircle className="w-4 h-4" /> Thêm cảnh đầu</button>
                          {addingAtIndex === -1 && <div className="w-full"><SceneInputForm placeholder="Mô tả cảnh mới..." submitLabel="Tạo Prompt Mới" onCancel={() => setAddingAtIndex(null)} onSubmit={(text: string) => handleAddScene(text, -1)} isProcessing={isProcessingItem} /></div>}
                      </div>
                  )}
                  {items.map((item: PromptItem, idx: number) => {
                      const isEditing = editingIndex === idx;
                      return (
                          <React.Fragment key={idx}>
                              <div className={`flex flex-col md:flex-row gap-4 p-5 bg-slate-800/50 border rounded-lg transition-colors group w-full relative ${isEditing ? 'border-cyan-500 ring-1 ring-cyan-500/50' : 'border-slate-700 hover:border-slate-500'}`}>
                                  <div className="flex-1 min-w-0">
                                      <div className="mb-2 flex items-center justify-between">
                                          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/40 border border-slate-700/50 ${colorClass}`}>{idPrefix === 'scene' ? `SCENE ${idx + 1}` : `#${idx + 1}`}</span>
                                          {isScript && !isEditing && <button onClick={() => setEditingIndex(idx)} disabled={isProcessingItem} className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 transition-colors px-2" title="Sửa"><Icons.PencilSquare className="w-4 h-4" /><span className="text-[10px] uppercase font-bold">Sửa</span></button>}
                                      </div>
                                      {isEditing ? (
                                          <SceneInputForm initialText="" placeholder={`Nhập gợi ý để viết lại cảnh ${idx + 1}...`} submitLabel="Viết Lại Prompt" onCancel={() => setEditingIndex(null)} onSubmit={(text: string) => handleRegenerateScene(text, idx)} isProcessing={isProcessingItem} />
                                      ) : (
                                          <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap font-medium break-words">{item[activeLang]}</p>
                                      )}
                                  </div>
                                  {!isEditing && <button onClick={() => handleCopyOne(item[activeLang], `${idPrefix}-${idx}`)} className={`shrink-0 w-full md:w-36 flex flex-row md:flex-col items-center justify-center gap-2 px-6 py-3 md:px-2 md:py-2 rounded-md border transition-all select-none ${copiedIds.has(`${idPrefix}-${idx}`) ? 'bg-green-900/20 border-green-600/50 text-green-500' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}>{copiedIds.has(`${idPrefix}-${idx}`) ? <><Icons.Check className="w-6 h-6" /><span className="text-xs font-bold uppercase">Đã Chép</span></> : <><Icons.Clipboard className="w-6 h-6" /><span className="text-xs font-bold uppercase">Copy</span></>}</button>}
                              </div>
                              {isScript && (
                                  <div className="relative group/divider py-2 flex flex-col items-center justify-center z-10">
                                      <button onClick={() => setAddingAtIndex(idx)} disabled={isProcessingItem} className="opacity-0 group-hover/divider:opacity-100 flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-xs text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-all z-10 transform hover:scale-105 mb-2"><Icons.PlusCircle className="w-4 h-4" /> Thêm cảnh</button>
                                      {addingAtIndex === idx && <div className="w-full relative z-50"><SceneInputForm placeholder="Mô tả ý tưởng cho cảnh mới..." submitLabel="Tạo Prompt Mới" onCancel={() => setAddingAtIndex(null)} onSubmit={(text: string) => handleAddScene(text, idx)} isProcessing={isProcessingItem} /></div>}
                                  </div>
                              )}
                          </React.Fragment>
                      );
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {!isUnlocked && <PasswordProtection onUnlock={() => setIsUnlocked(true)} onClose={onGoBack} />}
      
      {/* Header */}
      <div className="w-full h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 shrink-0 z-20">
          <div className="flex items-center gap-3">
              <Icons.VideoCamera className="w-6 h-6 text-cyan-500" />
              <h1 className="text-xl font-bold text-cyan-500 tracking-widest">GENERATE PROMPT</h1>
          </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-[300px] flex-shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">
              
              {/* Style */}
              <div>
                  <label className="block text-cyan-500 text-[10px] font-bold mb-3 uppercase tracking-wider">1. Phong cách Phim</label>
                  <div className="flex flex-col gap-3">
                      <button onClick={() => setCurrentStyle(FilmStyle.CINEMATIC)} disabled={isLoading} className={`flex flex-row items-center gap-3 p-3 rounded-md border text-left transition-all ${currentStyle === FilmStyle.CINEMATIC ? 'bg-cyan-900/20 border-cyan-500 text-cyan-500 shadow-lg shadow-cyan-500/10' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                          <Icons.VideoCamera className="w-5 h-5" />
                          <div><span className="text-xs font-bold uppercase block">Điện ảnh</span><span className="text-[10px] text-slate-500 block">Cinematic, 8K</span></div>
                      </button>
                      <button onClick={() => setCurrentStyle(FilmStyle.ANIMATION)} disabled={isLoading} className={`flex flex-row items-center gap-3 p-3 rounded-md border text-left transition-all ${currentStyle === FilmStyle.ANIMATION ? 'bg-cyan-900/20 border-cyan-500 text-cyan-500 shadow-lg shadow-cyan-500/10' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                          <Icons.Sparkles className="w-5 h-5" />
                          <div><span className="text-xs font-bold uppercase block">Hoạt hình</span><span className="text-[10px] text-slate-500 block">3D, Pixar Style</span></div>
                      </button>
                  </div>
              </div>

              {/* Dialogue */}
              <div>
                  <label className="block text-cyan-500 text-[10px] font-bold mb-3 uppercase tracking-wider">2. Chế độ Thoại</label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setCurrentDialogue(DialogueOption.NO_DIALOGUE)} disabled={isLoading} className={`flex flex-row items-center justify-center gap-2 py-2 px-1 rounded-md border text-center transition-all ${currentDialogue === DialogueOption.NO_DIALOGUE ? 'bg-cyan-900/20 border-cyan-500 text-cyan-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                          <Icons.SpeakerXMark className="w-4 h-4" /><span className="text-[10px] font-bold uppercase">Không Thoại</span>
                      </button>
                      <button onClick={() => setCurrentDialogue(DialogueOption.WITH_DIALOGUE)} disabled={isLoading} className={`flex flex-row items-center justify-center gap-2 py-2 px-1 rounded-md border text-center transition-all ${currentDialogue === DialogueOption.WITH_DIALOGUE ? 'bg-cyan-900/20 border-cyan-500 text-cyan-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                          <Icons.ChatBubble className="w-4 h-4" /><span className="text-[10px] font-bold uppercase">Có Thoại</span>
                      </button>
                  </div>
              </div>

              {/* Characters */}
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <label className="text-cyan-500 text-[10px] font-bold uppercase tracking-wider">3. Thiết lập Nhân Vật</label>
                      <button onClick={handleAddCharacter} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-cyan-500 transition-colors" disabled={isLoading}><Icons.UserPlus className="w-4 h-4" /> Thêm</button>
                  </div>
                  <div className="space-y-3">
                      {characters.map((char, idx) => (
                          <div key={char.id} className="bg-slate-800 border border-slate-700 rounded p-2 flex gap-3 relative group">
                              <div className="w-16 h-20 bg-slate-900 border border-slate-600 rounded flex items-center justify-center cursor-pointer overflow-hidden relative shrink-0 hover:border-cyan-500 transition-colors" onClick={() => document.getElementById(`file-${char.id}`)?.click()}>
                                  {char.image ? <img src={char.image} alt="Char" className="w-full h-full object-cover" /> : <Icons.Photo className="w-6 h-6 text-slate-600" />}
                                  <input type="file" id={`file-${char.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(char.id, e)} disabled={isLoading} />
                              </div>
                              <div className="flex-1 flex flex-col justify-center gap-1">
                                  <label className="text-[9px] text-slate-500 uppercase font-bold">Tên Nhân Vật</label>
                                  <input type="text" value={char.name} onChange={(e) => handleCharChange(char.id, 'name', e.target.value)} placeholder="Tấm, Cám..." className="bg-slate-900 border border-slate-700 rounded px-2 py-2 text-xs text-white focus:border-cyan-500 outline-none w-full" disabled={isLoading} />
                              </div>
                              <button onClick={() => handleRemoveCharacter(char.id)} className="absolute top-1 right-1 text-slate-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity" disabled={isLoading}><Icons.Trash className="w-4 h-4" /></button>
                          </div>
                      ))}
                      {characters.length === 0 && <div className="text-center p-4 border border-dashed border-slate-700 rounded text-slate-500 text-[10px]">Chưa có nhân vật. Bấm "Thêm" để upload ảnh mẫu.</div>}
                  </div>
              </div>

              {/* File Upload */}
              <div className="pt-6 border-t border-slate-800 mt-auto">
                  <label className="block text-cyan-500 text-[10px] font-bold mb-4 uppercase tracking-wider">4. Nhập Kịch Bản (.txt)</label>
                  <div onClick={() => !isLoading && fileInputRef.current?.click()} className={`border border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group relative overflow-hidden ${selectedFile ? 'border-cyan-500 bg-cyan-900/10' : 'border-slate-700 hover:bg-slate-800 hover:border-slate-500'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {selectedFile ? (
                          <div className="text-center w-full z-10">
                              <Icons.DocumentText className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                              <span className="text-xs font-bold text-slate-200 break-words line-clamp-2 px-2">{selectedFile.name}</span>
                              <span className="text-[9px] text-cyan-500 mt-1 block">{selectedFile.lines.length} cảnh</span>
                              <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"><Icons.XCircle className="w-5 h-5" /></button>
                          </div>
                      ) : (
                          <>
                              <Icons.DocumentText className="w-8 h-8 text-slate-600 group-hover:text-cyan-500 transition-colors" />
                              <div className="text-center"><span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 block">Tải lên file .txt</span><span className="text-[9px] text-slate-600 block mt-1">Mỗi dòng là 1 cảnh</span></div>
                          </>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleFileChange} disabled={isLoading} />
                  </div>
                  <button onClick={handleGenerate} disabled={!selectedFile || isLoading} className={`w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded font-bold uppercase text-xs tracking-wider transition-all ${selectedFile && !isLoading ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-900/20 transform hover:-translate-y-0.5' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                      {isLoading ? <><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div><span>Đang Xử Lý...</span></> : <><Icons.PlayCircle className="w-5 h-5" /><span>Tạo Nội Dung</span></>}
                  </button>
              </div>
          </aside>

          {/* Main Output */}
          <main className="flex-1 bg-slate-950 overflow-y-auto custom-scrollbar relative flex flex-col p-6">
              {error && <div className="w-full p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-center mb-6 animate-pulse">{error}</div>}
              {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                      <h3 className="text-xl font-bold text-cyan-500 tracking-widest animate-pulse mb-2">ĐANG XỬ LÝ KỊCH BẢN</h3>
                      <p className="text-sm text-slate-500">AI đang phân tích trang phục và bối cảnh...</p>
                  </div>
              )}
              
              <div className="animate-fade-in w-full pb-20">
                  <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur py-4 mb-8 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                          <button onClick={() => setActiveLang('vi')} className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${activeLang === 'vi' ? 'bg-cyan-600 text-slate-900 shadow' : 'text-slate-500 hover:text-slate-300'}`}>VIETNAMESE</button>
                          <button onClick={() => setActiveLang('en')} className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${activeLang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>ENGLISH</button>
                      </div>
                  </div>

                  {content.title && content.script.length > 0 && (
                      <div className="mb-10 text-center relative group">
                          <h1 className="text-3xl md:text-4xl font-bold text-cyan-500 tracking-wider mb-2 uppercase drop-shadow-md inline-block relative cursor-pointer" onClick={() => handleCopyOne(content.title[activeLang], 'title-main')}>
                              {content.title[activeLang]}
                              <span className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-white"><Icons.Clipboard className="w-6 h-6" /></span>
                          </h1>
                          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-cyan-700 to-transparent mx-auto rounded-full mt-2"></div>
                      </div>
                  )}

                  <div className="space-y-12 w-full">
                      <PromptSection title="Bối Cảnh (Set Design)" icon={Icons.Map} items={content.context} idPrefix="ctx" colorClass="text-blue-400" borderColor="border-blue-900/30" />
                      <PromptSection title="Nhân Vật (Characters)" icon={Icons.UserGroup} items={content.characters} idPrefix="char" colorClass="text-green-400" borderColor="border-green-900/30" />
                      <PromptSection title="Kịch Bản Phân Cảnh (Storyboard Prompts)" icon={Icons.Film} items={content.script} idPrefix="scene" colorClass="text-cyan-500" borderColor="border-cyan-900/30" isScript={true} />
                  </div>
              </div>
          </main>
      </div>
    </div>
  );
};

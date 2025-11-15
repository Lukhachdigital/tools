import type { ScriptParams, ScriptResponse } from '../types/veo31';
import { GoogleGenAI, Type } from '@google/genai';

// Add type definitions for the global window object to satisfy TypeScript.
declare global {
    interface Window {
        GoogleGenAI: typeof GoogleGenAI;
        GenAIType: typeof Type;
    }
}

export const generateScript = async (params: ScriptParams): Promise<ScriptResponse> => {
    if (!params.apiKey) {
        throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt API Key trong menu chính.");
    }
    const ai = new window.GoogleGenAI({ apiKey: params.apiKey });

    const styleMap = {
        'Hoạt hình': 'Cartoon',
        'Thực tế': 'Realistic',
        'Anime': 'Anime',
        'Điện ảnh': 'Cinematic',
    };

    const langMap = {
        'Vietnamese': 'Vietnamese',
        'English': 'English',
        'Không thoại': 'None',
    };

    const mappedStyle = styleMap[params.videoStyle];
    const mappedLang = langMap[params.dialogueLanguage];

    const characterAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Tên nhân vật và biệt danh (nếu có), ví dụ: 'Sparky (The Little Dragon)'." },
            description: { type: Type.STRING, description: "Mô tả vật lý cực kỳ chi tiết của nhân vật bằng tiếng Anh." },
            voice: { type: Type.STRING, description: "Mô tả chi tiết các đặc điểm giọng nói của nhân vật bằng tiếng Anh." }
        },
        required: ["name", "description", "voice"]
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            characterAnalysis: {
                type: Type.ARRAY,
                description: "Danh sách các hồ sơ nhân vật.",
                items: characterAnalysisSchema
            },
            script: {
                type: Type.ARRAY,
                description: `Một mảng gồm chính xác ${params.numPrompts} chuỗi kịch bản được phân tách bằng dấu gạch đứng.`,
                items: { type: Type.STRING }
            }
        },
        required: ["characterAnalysis", "script"]
    };

    const prompt = `
    BẠN LÀ MỘT NHÀ BIÊN KỊCH VÀ KỸ SƯ NHẮC LỆNH (PROMPT ENGINEER) CHUYÊN NGHIỆP CHO VEO3, AI CHUYỂN VĂN BẢN THÀNH VIDEO TIÊN TIẾN CỦA GOOGLE. MỖI NHẮC LỆNH TẠO RA MỘT CLIP VIDEO DÀI 8 GIÂY. NHIỆM VỤ CỦA BẠN: ĐẢM BẢO SỰ NHẤT QUÁN TUYỆT ĐỐI CỦA NHÂN VẬT QUA TẤT CẢ CÁC CLIP.

    **Yêu cầu của người dùng:**
    - Scene Descriptions (one per line): 
${params.topic}
    - Total Number of Scenes to Generate: ${params.numPrompts} (This is a strict requirement based on the number of lines provided above)
    - Video Style: ${mappedStyle}
    - Dialogue Language: ${mappedLang}
    - Subtitles: ${params.subtitles ? 'ON' : 'OFF'}

    **QUY TRÌNH LÀM VIỆC CỐT LÕI**
    1.  **Phân tích Nhân vật Đầu tiên:** Dựa trên TẤT CẢ các mô tả cảnh được cung cấp, tạo hồ sơ chi tiết cho các nhân vật chính sẽ xuất hiện.
    2.  **Tạo Kịch bản:** Xây dựng một câu chuyện mạch lạc dựa trên các mô tả cảnh theo thứ tự. Đối với MỖI mô tả cảnh từ người dùng, tạo ra một nhắc lệnh chi tiết được phân tách bằng dấu gạch đứng có không gian (" | ") với chính xác 11 phần theo thứ tự sau: Scene & Title, Character 1 Description, Character 2 Description, Style Description, Character Voices, Camera Shot, Setting Details, Mood, Audio Cues, Dialog, Subtitles. Bạn PHẢI tạo ra chính xác ${params.numPrompts} nhắc lệnh.

    **CÁC QUY TẮC QUAN TRỌNG NHẤT**
    1.  **NHẤT QUÁN NHÂN VẬT:** Sao chép MÔ TẢ VẬT LÝ CHÍNH XÁC từ characterAnalysis vào MỌI phân cảnh có nhân vật đó. KHÔNG thay đổi hoặc diễn đạt lại, trừ khi trạng thái vật lý của nhân vật thay đổi (ví dụ: "puts on a helmet").
    2.  **QUY TẮC NGÔN NGỮ:** TẤT CẢ các phần phải bằng TIẾNG ANH, NGOẠI TRỪ phần 'Dialog' phải được viết bằng '${mappedLang}'. Nếu ngôn ngữ là "None", hãy viết "Dialog: [None]".
    3.  **QUY TẮC ĐỊNH DẠNG:** Mỗi nhắc lệnh là MỘT chuỗi dài duy nhất, sử dụng " | " làm ký tự phân tách, và có chính xác 11 phần theo đúng thứ tự.
    4.  **MÔ TẢ CHI TIẾT:** Mô tả nhân vật và giọng nói phải cực kỳ chi tiết.
    5.  **DÒNG CHẢY CÂU CHUYỆN:** Các phân cảnh phải tiến triển một cách logic.

    **ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:** Chỉ trả về một đối tượng JSON hợp lệ.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ScriptResponse;
    } catch (error) {
        console.error("Lỗi khi tạo kịch bản:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt.');
        }
        throw new Error("Không thể tạo kịch bản từ AI. Vui lòng thử lại.");
    }
};
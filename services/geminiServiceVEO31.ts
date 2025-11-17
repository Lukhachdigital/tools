import type { ScriptParams, ScriptResponse } from '../types/veo31';
import { GoogleGenAI, Type } from '@google/genai';

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
        'Hiện đại': 'Modern',
        'Viễn tưởng': 'Sci-fi',
    };

    const langMap = {
        'Vietnamese': 'Vietnamese',
        'English': 'English',
        'Không thoại': 'None',
    };

    const mappedStyle = styleMap[params.videoStyle];
    const mappedLang = langMap[params.dialogueLanguage];

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            script: {
                type: Type.ARRAY,
                description: `Một mảng gồm chính xác ${params.numPrompts} chuỗi kịch bản được phân tách bằng dấu gạch đứng.`,
                items: { type: Type.STRING }
            }
        },
        required: ["script"]
    };

    const prompt = `
    BẠN LÀ MỘT ĐẠO DIỄN PHIM VÀ KỸ SƯ NHẮC LỆNH (PROMPT ENGINEER) CHUYÊN NGHIỆP CHO VEO 3.1. NHIỆM VỤ CỐT LÕI CỦA BẠN LÀ CHUYỂN THỂ TRUNG THỰC CÁC MÔ TẢ CẢNH CỦA NGƯỜI DÙNG THÀNH CÁC NHẮC LỆNH VIDEO CHI TIẾT, ĐẬM CHẤT ĐIỆN ẢNH.

    **Yêu cầu của người dùng:**
    - Scene Descriptions (one per line): 
${params.topic}
    - Total Number of Scenes to Generate: ${params.numPrompts} (This is a strict requirement based on the number of lines provided above)
    - Video Style: ${mappedStyle}
    - Dialogue Language: ${mappedLang}
    - Subtitles: OFF (This is a fixed requirement)

    **QUY TẮC SỐ 1 - TUÂN THỦ TUYỆT ĐỐI (QUAN TRỌNG NHẤT):**
    Mục tiêu hàng đầu của bạn là diễn giải và mở rộng một cách **TRUNG THỰC** ý tưởng **GỐC** mà người dùng cung cấp.
    - **KHÔNG BỊA ĐẶT:** Tuyệt đối không được bịa ra một câu chuyện mới, thêm nhân vật, hoặc các chi tiết không liên quan đến mô tả của người dùng.
    - **PHẠM VI SÁNG TẠO:** Sự sáng tạo của bạn chỉ nên được áp dụng vào việc **THỰC THI CẢNH QUAY** (góc máy, ánh sáng, chi tiết bối cảnh), không phải thay đổi nội dung cốt lõi.

    **QUY TẮC SỐ 2 - GIẢI MÃ VÀ TUÂN THỦ PHONG CÁCH (CỰC KỲ QUAN TRỌNG):**
    Bạn PHẢI tuân thủ "Phong cách Video" (${mappedStyle}) đã chọn một cách nghiêm ngặt. Đây là định nghĩa cho từng phong cách:
    - **Realistic (Thực tế):** QUAN TRỌNG NHẤT. Phong cách này yêu cầu sự chân thực tuyệt đối. Mọi thứ trong cảnh quay—con người, công nghệ, kiến trúc, quần áo, hành động—phải phản ánh chính xác thế giới **HIỆN TẠI (những năm 2020)**. **CẤM TUYỆT ĐỐI** mọi yếu tố tương lai, công nghệ viễn tưởng (như năm 2099, robot, xe bay), hay các yếu tố kỳ ảo. Nếu người dùng mô tả "một người đi trên đường phố", đó phải là một đường phố bình thường ngày nay, không phải một thành phố tương lai. Quy tắc này là BẮT BUỘC.
    - **Modern (Hiện đại):** Phong cách này cho phép thẩm mỹ đẹp mắt, sạch sẽ, và công nghệ tân tiến nhưng **có thật hoặc sắp có thật**. Ví dụ: kiến trúc tối giản, xe điện cao cấp, các thiết bị thông minh tinh vi. Vẫn bám sát thực tế, nhưng tập trung vào khía cạnh tiên tiến của thế giới hiện tại.
    - **Sci-fi (Viễn tưởng):** Cho phép tự do sáng tạo với các khái niệm tương lai xa, không gian, người ngoài hành tinh, AI siêu trí tuệ, công nghệ không tưởng.
    - **Cinematic (Điện ảnh):** Tập trung vào chất lượng hình ảnh như phim điện ảnh—ánh sáng kịch tính, màu sắc nghệ thuật, góc quay sáng tạo. Nội dung vẫn phải tuân theo logic của các phong cách khác (ví dụ: Cinematic + Realistic phải là một cảnh thực tế được quay đẹp như phim).
    - **Cartoon (Hoạt hình) & Anime:** Phong cách đồ họa, không cần tuân thủ quy luật vật lý thực tế.

    **CÁC QUY TẮC QUAN TRỌNG KHÁC:**
    1.  **KHÔNG NHẤT QUÁN NHÂN VẬT:** Bạn không cần giữ sự nhất quán về ngoại hình của nhân vật giữa các cảnh. Mỗi cảnh là độc lập. Hãy mô tả nhân vật dựa trên hành động và bối cảnh của từng cảnh.
    2.  **QUY TẮC NGÔN NGỮ:** TẤT CẢ các phần phải bằng TIẾNG ANH, NGOẠI TRỪ phần 'Dialog' phải được viết bằng '${mappedLang}'. Nếu ngôn ngữ là "None", hãy viết "Dialog: [None]".
    3.  **QUY TẮC ĐỊNH DẠNG:** Mỗi nhắc lệnh là MỘT chuỗi dài duy nhất, sử dụng " | " làm ký tự phân tách, và có chính xác 11 phần theo đúng thứ tự.
    4.  **KHÔNG CÓ VĂN BẢN TRÊN VIDEO:**
        - Phần 'Scene Title' PHẢI LUÔN LÀ "Scene Title: [None]".
        - Phần 'Subtitles' PHẢI LUÔN LÀ "Subtitles: [None]".

    **QUY TRÌNH LÀM VIỆC:**
    Đối với MỖI mô tả cảnh từ người dùng, hãy tạo ra một nhắc lệnh VEO 3.1 chi tiết. Nhắc lệnh này phải được phân tách bằng dấu gạch đứng có không gian (" | ") với chính xác 11 phần theo thứ tự sau: Scene Title, Character 1 Description, Character 2 Description, Style Description, Character Voices, Camera Shot, Setting Details, Mood, Audio Cues, Dialog, Subtitles. Bạn PHẢI tạo ra chính xác ${params.numPrompts} nhắc lệnh.

    **ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:** Chỉ trả về một đối tượng JSON hợp lệ chứa một khóa duy nhất là "script".
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
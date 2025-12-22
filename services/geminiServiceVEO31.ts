import type { ScriptParams, ScriptResponse } from '../types/veo31';
import { GoogleGenAI, Type } from '@google/genai';

export const generateScript = async (params: ScriptParams): Promise<ScriptResponse> => {
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

    const commonPrompt = `
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
    - **Cinematic (Điện ảnh):** Tập trung vào chất lượng hình ảnh như phim điện ảnh—ánh sáng kịch tính (dramatic lighting), độ sâu trường ảnh (depth of field), bố cục nghệ thuật.
    - **Cartoon (Hoạt hình):** Phong cách hoạt hình, màu sắc tươi sáng, nhân vật cách điệu.
    - **Anime (Anime):** Phong cách hoạt hình Nhật Bản 2D.

    **CẤU TRÚC ĐẦU RA (BẮT BUỘC JSON):**
    Bạn phải trả về một đối tượng JSON duy nhất với khóa "script". Giá trị của "script" là một mảng các chuỗi (array of strings), mỗi chuỗi là một prompt chi tiết cho một cảnh quay.
    {
      "script": [
        "Prompt cảnh 1...",
        "Prompt cảnh 2...",
        ...
      ]
    }
    
    **QUY TẮC VIẾT PROMPT:**
    1. Ngôn ngữ: TIẾNG ANH (English).
    2. Cấu trúc VEO 3.1: [Shot Type] of [Subject + Action] in [Setting], [Lighting], [Style], [Camera Movement].
    3. Chi tiết: Mô tả cực kỳ chi tiết về hình ảnh, ánh sáng, và chuyển động camera.
    `;

    // Priority 1: Gemini
    if (params.apiType === 'gemini') {
        if (!params.apiKey) throw new Error("API Key Gemini chưa được cấu hình.");
        const ai = new GoogleGenAI({ apiKey: params.apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: commonPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        script: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['script']
                },
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as ScriptResponse;
    }

    // Priority 2: OpenAI (GPT)
    if (params.apiType === 'gpt') {
        if (!params.apiKey) throw new Error("API Key OpenAI chưa được cấu hình.");
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${params.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: commonPrompt + "\n\nReturn STRICTLY JSON format." },
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        return JSON.parse(jsonText) as ScriptResponse;
    } 

    throw new Error("Loại API không hợp lệ.");
};
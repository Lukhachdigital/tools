
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
// 2. SUB-COMPONENTS
// ==========================================

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PodcastSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse w-full">
    {/* Title Skeleton */}
    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-slate-700 rounded w-1/4"></div>
        <div className="h-8 w-16 bg-slate-700 rounded"></div>
      </div>
      <div className="h-8 bg-slate-700 rounded w-3/4"></div>
      <div className="h-4 bg-slate-700 rounded w-20"></div>
    </div>

    {/* Content Skeleton */}
    <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-col space-y-4 min-h-[400px]">
      <div className="flex justify-between items-center mb-2">
         <div className="h-6 bg-slate-700 rounded w-1/3"></div>
         <div className="h-8 w-16 bg-slate-700 rounded"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-11/12"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-4/5"></div>
        <div className="h-20 bg-slate-700/50 rounded w-full mt-4"></div>
      </div>
    </div>
  </div>
);

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
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
      }`}
    >
      {copied ? 'Đã chép!' : 'Chép'}
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
        <div className="flex flex-col items-center w-full h-full">
          {/* <label className="block text-xs font-semibold text-gray-300 mb-1 text-center w-full">{label}</label> */}
          <div 
            className={`w-full h-full min-h-[100px] bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center transition relative group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-700'}`}
            onClick={() => !disabled && fileInputRef.current?.click()}
            title={label}
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
              <>
                <img src={uploadedImage.dataUrl} alt="Uploaded preview" className="w-full h-full object-cover rounded-lg" />
                <button
                    onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                    className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    disabled={disabled}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
              </>
            ) : (
              <div className="text-center text-gray-400 p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                <p className="text-[10px] leading-tight">Ảnh mặt</p>
              </div>
            )}
          </div>
        </div>
    );
};

// ==========================================
// 3. AI SERVICES (LOGIC)
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

const getSystemInstruction = (length: ArticleLength) => {
    const lengthInstruction = length === 'short'
    ? 'TUYỆT ĐỐI QUAN TRỌNG: Tổng độ dài của phần `article` và phần `engagementCall` cộng lại PHẢI nằm trong khoảng 2200 đến 2800 ký tự. Yêu cầu này là BẮT BUỘC và phải được tuân thủ nghiêm ngặt.'
    : 'TUYỆT ĐỐI QUAN TRỌNG: Bài viết (chỉ tính phần `article`) PHẢI có độ dài tổng cộng từ 8800 đến 11000 ký tự, được chia thành 4 phần riêng biệt và rõ ràng, mỗi phần từ 2200 đến 2750 ký tự.';

    return `Bạn là một chuyên gia viết lách đa tài, có khả năng hóa thân vào nhiều vai trò khác nhau (nhà tâm lý, chuyên gia kinh tế, nhà giáo dục, thiền sư, v.v.) tùy thuộc vào lĩnh vực được yêu cầu.

**NHIỆM VỤ:** Dựa vào **"CHỦ ĐỀ MỚI CẦN VIẾT"** và **"LĨNH VỰC / GÓC NHÌN"** do người dùng cung cấp, hãy sáng tạo một bài viết hoàn toàn mới.

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

const getUserContent = (topic: string, category: string) => `
**LĨNH VỰC / GÓC NHÌN:** ${category}
**CHỦ ĐỀ MỚI CẦN VIẾT:** "${topic}"

Hãy viết bài dựa trên lĩnh vực và chủ đề trên.
`;

// --- Gemini Service ---
const generateContentWithGemini = async (topic: string, category: string, length: ArticleLength, apiKey: string): Promise<GeneratedContent> => {
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = getSystemInstruction(length);
  const userContent = getUserContent(topic, category);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    const jsonString = response.text.trim();
    const parsedResult: GeneratedContent = JSON.parse(jsonString);

    return parsedResult;
  } catch (error) {
    console.error("Lỗi từ Gemini API:", error);
    throw new Error("Không thể tạo nội dung từ Gemini API. Vui lòng kiểm tra API Key.");
  }
};

// --- OpenAI Service ---
const generateContentWithOpenAI = async (topic: string, category: string, length: ArticleLength, apiKey: string): Promise<GeneratedContent> => {
  const systemInstruction = getSystemInstruction(length);
  const userContent = getUserContent(topic, category);

  const body = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Lỗi API từ OpenAI: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const contentString = data.choices[0].message.content;
    const parsedResult: GeneratedContent = JSON.parse(contentString);
    
    return parsedResult;

  } catch (error) {
    console.error("Lỗi khi gọi OpenAI API:", error);
    throw new Error("Không thể tạo nội dung từ OpenAI API.");
  }
};

// ==========================================
// 4. MAIN APP COMPONENT
// ==========================================

const ContentPodcastApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }) => {
  const [topic, setTopic] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tình yêu');
  const [articleLength, setArticleLength] = useState<ArticleLength>('short');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Image Generation State
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [whiskPrompt, setWhiskPrompt] = useState<string>('');
  const [visualDescription, setVisualDescription] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);


  const generateVisualsAndPrompt = async (content: GeneratedContent, apiKey: string) => {
      if (!apiKey) return;
      setIsGeneratingPrompt(true);
      setWhiskPrompt('');
      setVisualDescription('');

      const ai = new GoogleGenAI({ apiKey });
      try {
          // 1. Analyze for visual description
          const analysisPrompt = `Analyze the following article content and title to create a detailed visual description for an illustration image.
          Title: "${content.title}"
          Content: "${content.article.substring(0, 1500)}..."
          
          Tasks:
          1. Identify the core emotion/mood (e.g., romantic, sorrowful, inspiring, business-like).
          2. Determine the scene characters: How many? Gender? Age? (Based strictly on the story/article content).
          3. Describe the setting and lighting that matches the mood.
          4. Describe the action or pose of the character(s) that reflects the content.
          
          Output a single, detailed descriptive paragraph in English suitable for image generation. Focus on visual details.`;

          const analysisResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: analysisPrompt
          });
          const desc = analysisResponse.text.trim();
          setVisualDescription(desc);

          // 2. Generate Whisk Prompt
          const whiskGenPrompt = `Based on this visual description: "${desc}", create a concise, high-quality prompt for Whisk AI (Stable Diffusion). 
          Style: Cinematic, photorealistic, emotional, dramatic lighting, 8k.
          Output ONLY the prompt text.`;
          
          const whiskResponse = await ai.models.generateContent({
               model: 'gemini-2.5-flash',
               contents: whiskGenPrompt
          });
          setWhiskPrompt(whiskResponse.text.trim());

      } catch (err) {
          console.error("Error generating visual prompts:", err);
      } finally {
          setIsGeneratingPrompt(false);
      }
  }

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập tiêu đề/chủ đề.');
      return;
    }
    
    if (selectedAIModel === 'gpt' && !openaiApiKey) {
        setError('Vui lòng nhập OpenAI API Key trong phần cài đặt.');
        return;
    }
    
    if (selectedAIModel === 'gemini' && !geminiApiKey) {
        setError('Vui lòng nhập Gemini API Key trong phần cài đặt.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setGeneratedImageUrl(null);
    setWhiskPrompt('');
    setVisualDescription('');

    try {
      let result;
      if (selectedAIModel === 'gemini') {
        result = await generateContentWithGemini(topic, selectedCategory, articleLength, geminiApiKey);
      } else {
        result = await generateContentWithOpenAI(topic, selectedCategory, articleLength, openaiApiKey);
      }
      setGeneratedContent(result);
      
      // Automatically generate prompt using Gemini (even if content was generated by OpenAI, we use Gemini for image prompts usually, or prompt requires Gemini Key)
      // If user has Gemini Key, use it for prompts.
      if (geminiApiKey) {
          generateVisualsAndPrompt(result, geminiApiKey);
      } else {
          // If using OpenAI only, we can't use the Gemini-specific prompt gen logic easily without refactoring. 
          // Assuming user has Gemini Key if they want image features as per previous requests.
          // Or we can skip if no Gemini Key.
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      const modelName = selectedAIModel === 'gemini' ? 'Gemini' : 'Chat GPT';
      setError(`Đã xảy ra lỗi khi tạo nội dung bằng ${modelName}: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
      if (!geminiApiKey) {
          setError('Cần có Gemini API Key để sử dụng tính năng tạo ảnh.');
          return;
      }
      if (!visualDescription) {
          setError('Đang tạo mô tả hình ảnh, vui lòng đợi giây lát...');
          return;
      }

      setIsGeneratingImage(true);
      setError(null);
      setGeneratedImageUrl(null);

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      try {
          // 3. Generate Image using stored visualDescription
          if (referenceImage) {
               // If reference image is provided, use multimodal generation to swap/blend face
               const imageGenPrompt = `Generate a photorealistic image based on this description: ${visualDescription}.
               CRITICAL INSTRUCTION: Use the face from the provided image for the main character in this scene. Blend it naturally with the lighting and emotion described. The expression must match the mood of the description.`;
               
               const imageResponse = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: {
                      parts: [
                          { text: imageGenPrompt },
                          { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } }
                      ]
                  },
                  config: { responseModalities: [Modality.IMAGE] }
               });
               const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
               if (imagePart && imagePart.inlineData) {
                  setGeneratedImageUrl(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
               }
          } else {
              // If no reference image, use Imagen for high quality text-to-image
              const imageResponse = await ai.models.generateImages({
                  model: 'imagen-4.0-generate-001',
                  prompt: `${visualDescription}. Cinematic, photorealistic, high quality, emotional lighting.`,
                  config: {
                      numberOfImages: 1,
                      outputMimeType: 'image/png',
                      aspectRatio: '16:9'
                  }
              });
              if (imageResponse.generatedImages?.[0]?.image?.imageBytes) {
                  setGeneratedImageUrl(`data:image/png;base64,${imageResponse.generatedImages[0].image.imageBytes}`);
              } else {
                  throw new Error("Không nhận được dữ liệu ảnh từ Imagen.");
              }
          }

      } catch (err) {
          console.error(err);
          setError(`Lỗi khi tạo ảnh: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const ToggleButton: React.FC<{ options: string[], selected: string, onSelect: (value: any) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex bg-gray-700 rounded-lg p-1">
      {options.map(option => (
        <button
          key={option}
          onClick={(e) => { e.stopPropagation(); onSelect(option); }}
          className={`w-full text-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none ${selected === option ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}
        >
          {option}
        </button>
      ))}
    </div>
  );

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
                        className={`px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 border whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-purple-600 border-purple-600 text-white shadow-md transform scale-105'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                    <label htmlFor="topic-input" className="block text-sm font-medium text-gray-300 mb-2">Nhập tiêu đề bài viết</label>
                    <textarea
                    id="topic-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={`Ví dụ: Cách cân bằng giữa công việc và ${selectedCategory.toLowerCase()}...`}
                    className="w-full h-24 p-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-500"
                    disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Độ dài bài viết</label>
                    <ToggleButton options={['short', 'long']} selected={articleLength} onSelect={(val) => setArticleLength(val as ArticleLength)} />
                </div>

                 <button
                    onClick={(e) => { e.stopPropagation(); handleGenerateContent(); }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                    {isLoading ? <><LoadingSpinner /><span className="ml-2">Đang sáng tạo nội dung...</span></> : '1. Tạo Nội Dung'}
                </button>
             </div>
          </div>

          {/* NEW LOCATION: Image Generation Section */}
          <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-col space-y-4 relative overflow-hidden">
                {/* Visual Disabled Overlay if no content */}
                {!generatedContent && (
                    <div className="absolute inset-0 bg-slate-900/70 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <p className="text-gray-400 font-medium bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            Hãy tạo nội dung trước khi tạo ảnh
                        </p>
                    </div>
                )}

                <h3 className="text-xl font-bold text-pink-400 mb-2 border-b border-gray-700 pb-2">2. Tạo ảnh minh họa (AI Podcast)</h3>
                <p className="text-xs text-gray-400 italic">AI sẽ tự động phân tích bài viết để tạo ra hình ảnh phù hợp nhất với cảm xúc và nội dung câu chuyện.</p>
                
                {/* Upload and Result Layout */}
                <div className="flex flex-row gap-4 items-stretch h-32 sm:h-40">
                     {/* 1/5 Width Upload Area */}
                    <div className="w-1/4 min-w-[80px]">
                        <ImageUploader 
                            label="Tải ảnh mặt"
                            uploadedImage={referenceImage}
                            setUploadedImage={setReferenceImage}
                            disabled={isGeneratingImage || !generatedContent}
                        />
                    </div>
                     {/* Result Image Area (Rest of width) */}
                    <div className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                         {isGeneratingImage ? (
                             <div className="flex flex-col items-center text-pink-400">
                                 <LoadingSpinner />
                                 <span className="text-xs mt-2">Đang vẽ...</span>
                             </div>
                         ) : generatedImageUrl ? (
                             <>
                                <img 
                                    src={generatedImageUrl} 
                                    alt="Generated Result" 
                                    className="w-full h-full object-contain cursor-zoom-in"
                                    onClick={() => setLightboxImage(generatedImageUrl)}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                    <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Bấm để xem</span>
                                </div>
                             </>
                         ) : (
                             <div className="text-center text-gray-500 text-xs">
                                 <p>Ảnh kết quả sẽ hiện ở đây</p>
                             </div>
                         )}
                    </div>
                </div>

                <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !generatedContent || !visualDescription}
                    className="w-full flex items-center justify-center bg-pink-600 hover:bg-pink-700 disabled:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg"
                >
                   {isGeneratingImage ? 'Đang tạo ảnh...' : 'Tạo ảnh'}
                </button>

                {/* Generated Whisk Prompt Result */}
                {(whiskPrompt || isGeneratingPrompt) && (
                    <div className="mt-4 bg-slate-900 p-4 rounded-lg border border-slate-700 animate-fade-in">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-pink-300 text-sm">Prompt cho Whisk (English)</h4>
                                {whiskPrompt && <CopyButton textToCopy={whiskPrompt} />}
                            </div>
                            {isGeneratingPrompt ? (
                                <div className="flex items-center text-gray-400 text-xs">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Đang tạo prompt...
                                </div>
                            ) : (
                                <p className="text-gray-300 text-xs whitespace-pre-wrap bg-black/30 p-2 rounded font-mono max-h-32 overflow-y-auto custom-scrollbar">{whiskPrompt}</p>
                            )}
                    </div>
                )}
            </div>
        </div>
        
        {/* Right Panel: Results */}
        <div className="flex flex-col space-y-6">
            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">{error}</div>}
            
            {isLoading ? (
               <PodcastSkeleton />
            ) : generatedContent ? (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-indigo-400">Tiêu đề</h3>
                        <CopyButton textToCopy={generatedContent.title} />
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed overflow-y-auto flex-grow prose prose-invert">
                        <h2 className="text-2xl font-bold text-white">{generatedContent.title}</h2>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-purple-200 bg-purple-900 rounded-full">
                            {selectedCategory}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-col h-full min-h-[500px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-indigo-400">Nội dung & Lời kêu gọi</h3>
                        <CopyButton textToCopy={`${generatedContent.article}\n\n${generatedContent.engagementCall}`} />
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed overflow-y-auto flex-grow prose prose-invert prose-p:text-gray-300 custom-scrollbar pr-2">
                        <p className="mb-6">{generatedContent.article}</p>
                        <hr className="border-gray-600 my-4" />
                        <p className="italic text-indigo-300">{generatedContent.engagementCall}</p>
                    </div>
                </div>
              </div>
            ) : !error && (
                 <div className="bg-gray-800/50 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center p-12 text-gray-500 h-full min-h-[400px]">
                    <div className="text-center">
                        <p>Nội dung được tạo sẽ hiển thị ở đây</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContentPodcastApp;


import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// ==========================================
// 1. TYPES
// ==========================================

export enum ThemeCategory {
  GIANT = "Khổng lồ (Giant Food)",
  LUXURY = "Sang chảnh (Luxury Dining)",
  STREET = "Đường phố (Street Food)",
  ASMR = "ASMR (Mukbang)",
  WILD = "Hoang dã (Wild Cooking)",
  FUTURISTIC = "Tương lai (Futuristic Food)"
}

export type ProcessingState = 'idle' | 'analyzing' | 'success' | 'error';
export type OutfitMode = 'original' | 'auto';
export type VoiceGender = 'male' | 'female';
export type VoiceAccent = 'north' | 'south';

export interface GeneratedScenario {
  part: number;
  imagePrompt: string;
  videoPrompt: string;
  characterPrompt: string;
}

// ==========================================
// 2. COMPONENTS (Inlined)
// ==========================================

const Button = ({ children, className = '', isLoading = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) => (
  <button
    className={`bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${className}`}
    disabled={isLoading || props.disabled}
    {...props}
  >
    {isLoading && (
      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    )}
    {children}
  </button>
);

interface ImageUploadBoxProps {
  label: string;
  previewUrl: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  id: string;
  placeholderText?: string;
}

const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({ label, previewUrl, onFileSelect, onClear, id, placeholderText = "Tải ảnh lên" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center w-full">
      <h3 className="text-xs font-semibold text-slate-400 mb-2 self-start uppercase tracking-wider">{label}</h3>
      <div 
        className={`w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer text-center relative overflow-hidden group transition-all ${
          previewUrl 
          ? 'border-orange-500/50 bg-slate-900' 
          : 'border-slate-600 bg-slate-900 hover:border-orange-500/50 hover:bg-slate-800'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          id={id}
          ref={fileInputRef} 
          onChange={onFileSelect} 
          accept="image/*" 
          className="hidden" 
        />
        
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                type="button"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-2">
            <svg className="w-6 h-6 text-slate-500 group-hover:text-orange-400 mb-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] text-slate-400">{placeholderText}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface PromptCardProps {
  index: number;
  scenario: GeneratedScenario;
  onGenerateImage: () => void;
  imageUrl?: string;
  isLoading: boolean;
  onViewLarge: (url: string) => void;
  onDownload: (url: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ 
  index, 
  scenario, 
  onGenerateImage, 
  imageUrl, 
  isLoading, 
  onViewLarge, 
  onDownload 
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg hover:border-orange-500/50 transition-all duration-300 group">
      <div className="flex flex-col xl:flex-row">
        
        {/* Left: Prompts Content */}
        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
               <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs border border-orange-500/30">Scene {index + 1}</span>
               Phân cảnh {index + 1}
             </h3>
          </div>

          {/* Grid Layout for Prompts */}
          <div className="grid grid-cols-1 gap-3">
             
             {/* Whisk Prompt */}
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-orange-500/30 transition-colors relative group/prompt">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      Whisk AI (Image)
                   </span>
                   <button 
                     onClick={() => handleCopy(scenario.imagePrompt, 'image')}
                     className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover/prompt:opacity-100"
                     title="Copy"
                   >
                     {copiedField === 'image' ? <span className="text-green-500 text-xs font-bold">Copied!</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                   </button>
                </div>
                <p className="text-xs text-slate-300 font-mono line-clamp-2 hover:line-clamp-none transition-all cursor-text select-all">{scenario.imagePrompt}</p>
             </div>

             {/* Flow Prompt */}
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-blue-500/30 transition-colors relative group/prompt">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      Flow AI (Video)
                   </span>
                   <button 
                     onClick={() => handleCopy(scenario.videoPrompt, 'video')}
                     className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover/prompt:opacity-100"
                     title="Copy"
                   >
                     {copiedField === 'video' ? <span className="text-green-500 text-xs font-bold">Copied!</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                   </button>
                </div>
                <p className="text-xs text-slate-300 font-mono line-clamp-2 hover:line-clamp-none transition-all cursor-text select-all">{scenario.videoPrompt}</p>
             </div>

             {/* Character Prompt */}
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-green-500/30 transition-colors relative group/prompt">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Character
                   </span>
                   <button 
                     onClick={() => handleCopy(scenario.characterPrompt, 'char')}
                     className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover/prompt:opacity-100"
                     title="Copy"
                   >
                     {copiedField === 'char' ? <span className="text-green-500 text-xs font-bold">Copied!</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                   </button>
                </div>
                <p className="text-xs text-slate-300 font-mono line-clamp-1 hover:line-clamp-none transition-all cursor-text select-all">{scenario.characterPrompt}</p>
             </div>
          </div>
        </div>

        {/* Right: Image Generation (Square) */}
        <div className="w-full xl:w-[300px] bg-slate-900/50 border-t xl:border-t-0 xl:border-l border-slate-700 flex flex-col items-center justify-center p-4 relative group/image">
           {imageUrl ? (
             <div className="relative w-full h-full min-h-[250px] flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt={`Generated scene ${index + 1}`} 
                  className="w-full h-auto max-h-[280px] object-contain rounded-lg shadow-lg cursor-pointer hover:shadow-orange-500/20 transition-shadow"
                  onClick={() => onViewLarge(imageUrl)}
                />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                   <button onClick={() => onViewLarge(imageUrl)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition-all transform hover:scale-110">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   </button>
                   <button onClick={() => onDownload(imageUrl)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition-all transform hover:scale-110">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </button>
                </div>
             </div>
           ) : (
             <div className="text-center p-6 w-full">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 border border-slate-700">
                   <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-slate-500 text-xs mb-4">Chưa có ảnh minh họa</p>
                <Button onClick={onGenerateImage} isLoading={isLoading} className="w-full py-2 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-none from-transparent to-transparent text-slate-300 hover:text-white">
                   Generate Image
                </Button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. SERVICE LOGIC (Integrated)
// ==========================================

const generateCreativePrompts = async (
  faceImageBase64: string,
  productImageBase64: string | null,
  category: ThemeCategory,
  userIdea: string,
  hasDialogue: boolean,
  outfitMode: OutfitMode,
  voiceGender: VoiceGender,
  voiceAccent: VoiceAccent,
  geminiApiKey: string,
  openaiApiKey: string,
  selectedModel: string
): Promise<GeneratedScenario[]> => {
  
  const systemPrompt = `You are a professional Food Review Content Director. Your task is to generate a storyboard of 4 consecutive scenes based on a user's idea and uploaded reference images.

  **INPUTS:**
  1.  **Face Image (Image 1):** Use to identify the main character's gender, age, and approximate look.
  ${productImageBase64 ? '2.  **Product Image (Image 2):** Analyze this image to identify the specific food or product being reviewed. You MUST describe this exact product in the prompts and make it the central focus.' : ''}
  3.  **Theme:** ${category}
  4.  **User Idea:** "${userIdea}"
  5.  **Settings:**
      - Dialogue: ${hasDialogue ? "YES" : "NO"}
      - Outfit Mode: ${outfitMode === 'original' ? "Keep original outfit from photo" : "Auto-generate outfit based on context"}
      - Voice (if dialogue): ${voiceGender} voice, ${voiceAccent} accent.

  **OUTPUT REQUIREMENTS:**
  Generate exactly 4 scenes (Part 1, 2, 3, 4) telling a mini-story.
  Return a valid JSON object with a key "scenarios" which is an array of objects.
  Each object must have:
  - "part": number (1-4)
  - "imagePrompt": (For Whisk/Gemini Image) A detailed English prompt for a photorealistic image. Start with "A photorealistic portrait of [Character Description]...". Include details of the food/product, the environment (${category}), and the action. ${outfitMode === 'original' ? "Describe the outfit matching the uploaded image." : "Describe a creative outfit matching the food theme."}
  - "videoPrompt": (For VEO/Sora) A detailed English prompt for an 8s video clip. Start with "Cinematic shot of...". Describe camera movement, lighting, and action.
  - "characterPrompt": A consistent description of the main character to ensure consistency across scenes.

  **IMPORTANT RULES:**
  - If Dialogue is YES: Include a short, catchy voiceover line in Vietnamese in the "videoPrompt" formatted as: "Audio: Voiceover (${voiceGender}, ${voiceAccent} accent): '[Vietnamese text]'."
  - If Dialogue is NO: Do NOT include any Audio/Voiceover instructions.
  - Ensure continuity: The character should look consistent.
  - The "Food/Product" must be the highlight.
  `;

  // Priority: OpenAI -> Gemini for TEXT
  let finalError;
  let result: any = null;

  // 1. Try OpenAI (GPT-4o Multimodal)
  if ((selectedModel === 'openai' || selectedModel === 'auto') && openaiApiKey) {
      try {
          const content = [
              { type: "text", text: systemPrompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${faceImageBase64}` } }
          ];
          if (productImageBase64) {
              content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${productImageBase64}` } });
          }

          const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${openaiApiKey}`
              },
              body: JSON.stringify({
                  model: "gpt-4o",
                  messages: [
                      { role: "user", content: content }
                  ],
                  response_format: { type: "json_object" }
              })
          });
          const data = await response.json();
          result = JSON.parse(data.choices[0].message.content);
      } catch (e) {
          console.warn("OpenAI failed", e);
          if (selectedModel === 'openai') throw e;
          finalError = e;
      }
  }

  // 2. Try Gemini (Multimodal)
  if (!result && (selectedModel === 'gemini' || selectedModel === 'auto') && geminiApiKey) {
      try {
          const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
          
          const parts = [
              { text: systemPrompt + " Return JSON." },
              { inlineData: { mimeType: "image/jpeg", data: faceImageBase64 } }
          ];
          if (productImageBase64) {
              parts.push({ inlineData: { mimeType: "image/jpeg", data: productImageBase64 } });
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts },
              config: { responseMimeType: "application/json" }
          });
          
          result = JSON.parse(response.text);
      } catch (e) {
          console.warn("Gemini failed", e);
          finalError = e;
      }
  }

  if (result && result.scenarios) {
      return result.scenarios;
  }

  throw finalError || new Error("Failed to generate prompts from any provider.");
};

const generateImageVariation = async (
  faceImageBase64: string,
  productImageBase64: string | null,
  prompt: string,
  geminiApiKey: string,
  openaiApiKey: string,
  selectedModel: string
): Promise<string> => {
  
  // Priority: Gemini -> OpenAI for IMAGE
  let finalError;
  let imageUrl: string | null = null;

  // 1. Try Gemini (Gemini 2.5 Flash Image - Face Swap/Variation capable)
  if ((selectedModel === 'gemini' || selectedModel === 'auto') && geminiApiKey) {
      try {
          const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
          const parts = [
              { text: `Generate a photorealistic image based on this prompt: ${prompt}. \n\nIMPORTANT: Use the face from the first provided image source as the reference for the main character. Maintain the identity strictly.` },
              { inlineData: { mimeType: "image/jpeg", data: faceImageBase64 } }
          ];
          if (productImageBase64) {
              parts.push({ inlineData: { mimeType: "image/jpeg", data: productImageBase64 } });
              parts[0].text += " Also, use the second provided image as the reference for the product/food. The character should be interacting with this specific product.";
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts },
              config: { responseModalities: [window.GenAIModality.IMAGE] }
          });
          
          const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
          if (imagePart && imagePart.inlineData) {
              imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          }
      } catch (e) {
          console.warn("Gemini Image Gen failed", e);
          if (selectedModel === 'gemini') throw e;
          finalError = e;
      }
  }

  // 2. Try OpenAI (DALL-E 3 - Text to Image only, fallback drops face reference)
  if (!imageUrl && (selectedModel === 'openai' || selectedModel === 'auto') && openaiApiKey) {
      try {
          const response = await fetch("https://api.openai.com/v1/images/generations", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${openaiApiKey}`
              },
              body: JSON.stringify({
                  model: "dall-e-3",
                  prompt: prompt, // DALL-E 3 doesn't support inline image reference for variation in this API endpoint easily
                  n: 1,
                  size: "1024x1024",
                  response_format: "b64_json",
                  quality: "hd",
                  style: "natural"
              })
          });
          if (!response.ok) throw new Error("OpenAI DALL-E failed");
          const data = await response.json();
          imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
      } catch (e) {
          console.warn("OpenAI Image Gen failed", e);
          finalError = e;
      }
  }

  if (imageUrl) return imageUrl;
  throw finalError || new Error("Failed to generate image.");
};


// ==========================================
// 4. MAIN APP
// ==========================================

const FoodReviewApp: React.FC<{ geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }> = ({ geminiApiKey, openaiApiKey, selectedAIModel }) => {
  // State for Face Image
  const [faceImageBase64, setFaceImageBase64] = useState<string | null>(null);
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null);

  // State for Product Image
  const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  
  const [category, setCategory] = useState<ThemeCategory>(ThemeCategory.GIANT);
  const [userIdea, setUserIdea] = useState<string>("");
  const [hasDialogue, setHasDialogue] = useState<boolean>(false);
  const [outfitMode, setOutfitMode] = useState<OutfitMode>('auto');
  
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>('south');
  
  const [scenarios, setScenarios] = useState<GeneratedScenario[]>([]);
  
  const [generatedImages, setGeneratedImages] = useState<{[key: number]: string}>({});
  const [loadingImages, setLoadingImages] = useState<{[key: number]: boolean}>({});
  
  const [modalImage, setModalImage] = useState<string | null>(null);
  
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Handlers for Face Upload
  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFacePreviewUrl(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFaceImageBase64(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
      // Reset scenarios when main character changes
      setScenarios([]);
      setGeneratedImages({});
      setErrorMsg(null);
    }
  };

  const handleFaceClear = () => {
      setFacePreviewUrl(null);
      setFaceImageBase64(null);
  };

  // Handlers for Product Upload
  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductPreviewUrl(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProductImageBase64(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductClear = () => {
      setProductPreviewUrl(null);
      setProductImageBase64(null);
  };

  const handleGeneratePrompts = async () => {
    if (!geminiApiKey && !openaiApiKey) {
        setErrorMsg("Vui lòng cài đặt ít nhất một API Key.");
        return;
    }
    if (!faceImageBase64) {
      setErrorMsg("Vui lòng tải ảnh khuôn mặt lên trước.");
      return;
    }
    if (!userIdea.trim()) {
      setErrorMsg("Vui lòng nhập ý tưởng của bạn.");
      return;
    }

    setStatus('analyzing');
    setErrorMsg(null);
    setScenarios([]);
    setGeneratedImages({});

    try {
      const results = await generateCreativePrompts(
        faceImageBase64, 
        productImageBase64,
        category, 
        userIdea, 
        hasDialogue, 
        outfitMode,
        voiceGender,
        voiceAccent,
        geminiApiKey,
        openaiApiKey,
        selectedAIModel
      );
      setScenarios(results);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate prompts.");
      setStatus('error');
    }
  };

  const handleGenerateSingleImage = async (index: number, prompt: string) => {
    if (!faceImageBase64) return;
    if (!geminiApiKey && !openaiApiKey) {
        setErrorMsg("Vui lòng cài đặt API Key.");
        return;
    }
    
    setLoadingImages(prev => ({ ...prev, [index]: true }));
    
    try {
      const resultBase64 = await generateImageVariation(
          faceImageBase64,
          productImageBase64,
          prompt,
          geminiApiKey,
          openaiApiKey,
          selectedAIModel
      );
      setGeneratedImages(prev => ({ ...prev, [index]: resultBase64 }));
    } catch (err: any) {
      alert("Failed to generate image: " + err.message);
    } finally {
      setLoadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDownloadImage = (base64Data: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `foodreview-scene-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAll = (type: 'image' | 'video' | 'character') => {
    if (scenarios.length === 0) return;

    const content = scenarios.map(s => {
      if (type === 'image') return s.imagePrompt;
      if (type === 'video') return s.videoPrompt;
      if (type === 'character') return s.characterPrompt;
      return '';
    }).join('\n\n');

    navigator.clipboard.writeText(content);
    
    let feedbackMsg = "";
    if (type === 'image') feedbackMsg = "Đã chép tất cả Whisk Prompts!";
    if (type === 'video') feedbackMsg = "Đã chép tất cả Flow Prompts!";
    if (type === 'character') feedbackMsg = "Đã chép tất cả Character Prompts!";
    
    setCopyFeedback(feedbackMsg);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDownloadAllImages = () => {
    const indices = Object.keys(generatedImages);
    if (indices.length === 0) return;

    indices.forEach((indexStr, i) => {
      setTimeout(() => {
        const index = parseInt(indexStr);
        const url = generatedImages[index];
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `foodreview-part-${index + 1}-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, i * 500);
    });
  };

  return (
    <div className="w-full h-full p-4 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: Controls */}
        <div className="w-full lg:w-1/3 flex-shrink-0 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col gap-6">
              
              {/* Dual Image Upload Area */}
              <div className="flex flex-row gap-3">
                  <div className="flex-1">
                      <ImageUploadBox 
                          id="face-upload"
                          label="Ảnh Face (Khuôn mặt)"
                          previewUrl={facePreviewUrl}
                          onFileSelect={handleFaceFileChange}
                          onClear={handleFaceClear}
                          placeholderText="Tải ảnh mặt"
                      />
                  </div>
                  <div className="flex-1">
                      <ImageUploadBox 
                          id="product-upload"
                          label="Ảnh Sản phẩm (Tùy chọn)"
                          previewUrl={productPreviewUrl}
                          onFileSelect={handleProductFileChange}
                          onClear={handleProductClear}
                          placeholderText="Tải ảnh SP"
                      />
                  </div>
              </div>

              {/* Theme Category */}
              <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Chủ đề (Theme)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.values(ThemeCategory).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`w-full rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center px-1 py-2 text-center ${
                            category === cat 
                            ? 'bg-orange-600/20 text-orange-400 border-orange-500/50' 
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {cat.split('(')[0].trim()}
                        </button>
                      ))}
                  </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Outfit Mode */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Trang phục</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOutfitMode('original')}
                        className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                          outfitMode === 'original'
                            ? 'bg-pink-600/20 border-pink-500 text-pink-400' 
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        Gốc
                      </button>
                      <button
                        onClick={() => setOutfitMode('auto')}
                        className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                          outfitMode === 'auto' 
                            ? 'bg-pink-600/20 border-pink-500 text-pink-400' 
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  {/* Dialogue */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Lời thoại</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHasDialogue(false)}
                        className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                          !hasDialogue 
                            ? 'bg-slate-600 border-slate-500 text-white' 
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        Tắt
                      </button>
                      <button
                        onClick={() => setHasDialogue(true)}
                        className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                          hasDialogue 
                            ? 'bg-green-600/20 border-green-500 text-green-400' 
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        Bật
                      </button>
                    </div>
                  </div>
              </div>
              
              {/* Voice Settings (Conditional) */}
              {hasDialogue && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Giọng</label>
                          <div className="flex gap-2">
                              <button
                                onClick={() => setVoiceGender('male')}
                                className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                                  voiceGender === 'male' 
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500'
                                }`}
                              >
                                Nam
                              </button>
                              <button
                                onClick={() => setVoiceGender('female')}
                                className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                                  voiceGender === 'female' 
                                    ? 'bg-pink-600/20 border-pink-500 text-pink-400' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500'
                                }`}
                              >
                                Nữ
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Vùng miền</label>
                          <div className="flex gap-2">
                              <button
                                onClick={() => setVoiceAccent('north')}
                                className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                                  voiceAccent === 'north' 
                                    ? 'bg-amber-600/20 border-amber-500 text-amber-400' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500'
                                }`}
                              >
                                Bắc
                              </button>
                              <button
                                onClick={() => setVoiceAccent('south')}
                                className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                                  voiceAccent === 'south' 
                                    ? 'bg-amber-600/20 border-amber-500 text-amber-400' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500'
                                }`}
                              >
                                Nam
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Idea Input */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Ý tưởng của bạn</label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none leading-relaxed h-24"
                  placeholder="Ví dụ: Ăn cua hoàng đế trên đỉnh núi tuyết, review quán ốc vỉa hè..."
                  value={userIdea}
                  onChange={(e) => setUserIdea(e.target.value)}
                />
              </div>

              {/* Action Button */}
              <Button 
                  className="w-full py-3 text-base font-bold shadow-xl tracking-wide uppercase" 
                  onClick={handleGeneratePrompts}
                  isLoading={status === 'analyzing'}
                  disabled={!faceImageBase64}
                >
                  TẠO KỊCH BẢN & PROMPT
              </Button>
              {errorMsg && (
                  <p className="text-xs text-red-400 text-center bg-red-900/20 p-2 rounded border border-red-900/50">{errorMsg}</p>
              )}
            </div>
        </div>

        {/* Right Content: Scenarios & Images */}
        <div className="w-full lg:w-2/3 flex flex-col h-full overflow-hidden">
           
           {/* Results Container */}
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
               
               {status === 'idle' && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20 p-10 min-h-[400px]">
                     <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700">
                        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                     </div>
                     <p className="text-xl font-light uppercase tracking-wider">Bắt đầu sáng tạo</p>
                     <p className="text-sm mt-2">Tải ảnh khuôn mặt và nhập ý tưởng để bắt đầu</p>
                  </div>
               )}

               {status === 'analyzing' && (
                  <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                    <div className="relative">
                       <div className="w-20 h-20 border-4 border-orange-600/30 rounded-full"></div>
                       <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-6 mb-1 tracking-wide">ĐANG PHÂN TÍCH...</h3>
                    <p className="text-slate-500 text-sm">AI đang viết 4 phân cảnh liên kết</p>
                  </div>
                )}

                {scenarios.length > 0 && (
                  <div className="space-y-6 pb-20">
                     
                     {/* Results Header + Bulk Actions */}
                     <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-orange-500 text-2xl">❖</span> Story Sequence
                          </h2>
                          <span className="text-slate-400 text-sm font-medium bg-slate-900/50 px-2 py-1 rounded">(4 Scenes)</span>
                        </div>

                        {/* Bulk Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                           <button 
                             onClick={() => handleCopyAll('image')}
                             className="px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white rounded text-xs font-bold transition-all"
                           >
                             Copy All Whisk
                           </button>
                           <button 
                             onClick={() => handleCopyAll('video')}
                             className="px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white rounded text-xs font-bold transition-all"
                           >
                             Copy All Flow
                           </button>
                           <div className="w-px h-6 bg-slate-700 mx-1 hidden md:block"></div>
                           <button 
                             onClick={handleDownloadAllImages}
                             className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow-md"
                           >
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             Download All
                           </button>
                        </div>

                        {/* Feedback Toast */}
                        {copyFeedback && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 mt-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-bounce z-50">
                            {copyFeedback}
                          </div>
                        )}
                     </div>
                     
                     {scenarios.map((scenario, index) => (
                        <PromptCard 
                          key={index}
                          index={index}
                          scenario={scenario} 
                          onGenerateImage={() => handleGenerateSingleImage(index, scenario.imagePrompt)}
                          imageUrl={generatedImages[index]}
                          isLoading={loadingImages[index] || false}
                          onViewLarge={(url) => setModalImage(url)}
                          onDownload={(url) => handleDownloadImage(url)}
                        />
                      ))}
                  </div>
                )}
           </div>
        </div>

      {/* Full Screen Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-pointer"
          onClick={() => setModalImage(null)}
        >
           <button 
              onClick={() => setModalImage(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
           >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           
           <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img 
                src={modalImage} 
                alt="Full size" 
                className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl border border-white/10" 
                onClick={(e) => e.stopPropagation()} 
              />
              <div className="mt-6 flex gap-4" onClick={(e) => e.stopPropagation()}>
                 <Button onClick={() => handleDownloadImage(modalImage)} className="bg-white text-black hover:bg-slate-200 px-8 py-3 border-none">
                    Download High Res
                 </Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default FoodReviewApp;

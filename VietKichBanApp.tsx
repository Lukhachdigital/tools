
import React, { useState, useCallback } from 'react';

// --- TYPES ---
interface Character {
  name: string;
  role: string;
  description: string;
  whiskPrompt: string;
}

interface ContextItem {
  name: string;
  description: string;
  whiskPrompt: string;
}

interface GeneratedContent {
  characterList: Character[];
  contextList: ContextItem[];
  prompts: string[];
}

// --- UTILS ---
const cleanJsonString = (text: string) => {
    if (!text) return "";
    let cleaned = text.trim();
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1];
    }
    return cleaned.trim();
};

// --- COMPONENTS ---
const Loader = ({ message = "AI đang viết kịch bản..." }: { message?: string }): React.ReactElement => {
  return (
    React.createElement("div", { className: "flex flex-col items-center justify-center p-8 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700" },
      React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4" }),
      React.createElement("p", { className: "text-cyan-300 font-medium animate-pulse text-center" }, message)
    )
  );
};

const Lightbox = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }): React.ReactElement => {
    if (!imageUrl) return null;
  
    const handleSave = () => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  
    const outerDivProps: React.HTMLAttributes<HTMLDivElement> = {
      className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md",
      onClick: onClose
    };

    const innerDivProps: React.HTMLAttributes<HTMLDivElement> = {
      className: "relative w-full max-w-5xl max-h-[95vh] p-4 flex flex-col items-center",
      onClick: (e) => e.stopPropagation()
    };

    return (
      React.createElement("div",
        outerDivProps,
        React.createElement("div",
          innerDivProps,
          React.createElement("img", { src: imageUrl, alt: "Generated Content", className: "max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl mb-6 border border-white/10" }),
          React.createElement("div", { className: "flex gap-4" },
              React.createElement("button", {
                  onClick: handleSave,
                  className: "px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-all shadow-lg flex items-center gap-2"
              }, "Tải ảnh về"),
              React.createElement("button", {
                  onClick: onClose,
                  className: "px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all shadow-lg"
              }, "Đóng")
          )
        )
      )
    );
};

const ResultCard = ({ title, role, description, whiskPrompt, index, onGenerateImage, imageData, onImageClick }: {
    title: string;
    role?: string;
    description: string;
    whiskPrompt: string;
    index: number;
    onGenerateImage: (index: number, prompt: string, ratio: '16:9' | '9:16') => void;
    imageData: { imageUrl?: string; isGenerating?: boolean; error?: string; };
    onImageClick: (url: string) => void;
}): React.ReactElement => {
  const [copied, setCopied] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };
  
  const { imageUrl, isGenerating, error } = imageData;
  const imageContainerAspectRatio = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';

  return (
    React.createElement("div", { className: "bg-gray-900/50 p-5 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors" },
       React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4" },
         React.createElement("div", { className: "flex items-center gap-3" },
           React.createElement("h4", { className: "text-lg font-bold text-gray-100" }, title),
           role && React.createElement("span", {
               className: `text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${role === 'Nhân vật chính' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-gray-700/50 text-gray-400 border border-gray-600'}`
           }, role)
         ),
         React.createElement("div", { className: "flex items-center gap-2 flex-shrink-0" },
            React.createElement("button", { onClick: () => setAspectRatio('16:9'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '16:9' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}` }, "Ngang"),
            React.createElement("button", { onClick: () => setAspectRatio('9:16'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '9:16' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}` }, "Dọc"),
            React.createElement("button", {
                onClick: () => onGenerateImage(index, whiskPrompt, aspectRatio),
                disabled: isGenerating,
                className: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-xs font-bold py-1.5 px-4 rounded-md disabled:opacity-50 disabled:cursor-wait transition shadow-lg ml-2"
            }, isGenerating ? "Đang tạo..." : "Tạo ảnh")
         )
       ),
       React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
         React.createElement("div", { className: "flex flex-col" },
           React.createElement("p", { className: "text-gray-300 text-sm mb-4 leading-relaxed italic border-l-2 border-gray-700 pl-3" }, description),
           React.createElement("div", { className: "mt-auto" },
             React.createElement("p", { className: "font-bold text-[10px] uppercase tracking-widest text-indigo-400 mb-2" }, "Whisk Reference Prompt:"),
             React.createElement("div", { className: "relative bg-slate-950 p-3 rounded-lg border border-gray-700/50" },
               React.createElement("p", { className: "text-gray-400 text-xs break-words pr-24 font-mono leading-relaxed" }, whiskPrompt),
               React.createElement("button", {
                 onClick: () => copyToClipboard(whiskPrompt),
                 className: `absolute top-2 right-2 px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 text-[10px] font-bold rounded hover:bg-indigo-600 hover:text-white transition-all ${copied ? 'bg-green-600 border-green-500 text-white' : ''}`,
               }, copied ? 'Đã sao chép' : 'Sao chép')
             )
           )
         ),
         React.createElement("div", { className: `w-full ${imageContainerAspectRatio} bg-black/40 rounded-xl flex items-center justify-center overflow-hidden border border-gray-800 shadow-inner group/img relative` },
            isGenerating && React.createElement("div", { className: "flex flex-col items-center gap-2" },
                React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" }),
                React.createElement("span", { className: "text-[10px] text-green-500 font-bold animate-pulse uppercase" }, "Processing")
            ),
            error && React.createElement("div", { className: "p-4 text-center" }, 
                React.createElement("p", { className: "text-red-500 text-xs font-bold mb-1" }, "LỖI TẠO ẢNH"),
                React.createElement("p", { className: "text-gray-500 text-[10px]" }, error)
            ),
            imageUrl && !isGenerating && !error && (
                React.createElement("img", {
                    src: imageUrl,
                    alt: `Generated result`,
                    className: "w-full h-full object-contain cursor-pointer transition-transform duration-500 group-hover/img:scale-105",
                    onClick: () => onImageClick(imageUrl)
                })
            ),
            !isGenerating && !error && !imageUrl && React.createElement("div", { className: "text-center opacity-20" }, 
                React.createElement("svg", { className: "w-12 h-12 mx-auto mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />),
                React.createElement("p", { className: "text-[10px] font-bold uppercase tracking-widest" }, "Preview")
            )
         )
       )
    )
  );
};

const PromptCard = ({ prompt, promptNumber }: { prompt: string; promptNumber: number }): React.ReactElement => {
  const [copied, setCopied] = useState(false);
  const formattedPrompt = `Scene ${promptNumber}: ${prompt}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    React.createElement("div", { className: "relative bg-slate-800/80 p-5 rounded-xl border border-gray-700 mb-4 group hover:border-cyan-500/30 transition-all shadow-md" },
      React.createElement("div", { className: "flex justify-between items-center mb-3" },
          React.createElement("h4", { className: "text-cyan-500 font-black text-xs uppercase tracking-widest" }, `Cảnh ${promptNumber}`),
          React.createElement("button", {
            onClick: () => copyToClipboard(formattedPrompt),
            className: `px-4 py-1.5 bg-indigo-600/10 border border-indigo-500/50 text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm ${copied ? 'bg-green-600 border-green-500 text-white' : 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all'}`,
          }, copied ? 'Đã sao chép' : 'Sao chép Prompt')
      ),
      React.createElement("p", { className: "text-gray-300 text-sm leading-relaxed font-mono whitespace-pre-wrap select-all" }, formattedPrompt)
    )
  );
};

const cinematicStyles = [
  "Hiện đại", "Điện ảnh", "Viễn tưởng", "Tiền sử", "Hoạt hình", "Hài hước"
];

// --- APP COMPONENT ---
const VietKichBanApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }): React.ReactElement => {
  const [videoIdea, setVideoIdea] = useState('');
  const [userSuggestions, setUserSuggestions] = useState('');
  const [duration, setDuration] = useState('');
  const [numMainCharacters, setNumMainCharacters] = useState('');
  const [numSupportingCharacters, setNumSupportingCharacters] = useState('');
  const [selectedCinematicStyle, setSelectedCinematicStyle] = useState('Hiện đại');
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterImages, setCharacterImages] = useState<{ [key: string]: { imageUrl?: string; isGenerating?: boolean; error?: string; } }>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  const [hasVoice, setHasVoice] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'Vietnamese' | 'English'>('Vietnamese');

  // Pagination State
  const [currentPart, setCurrentPart] = useState(1);
  const [totalParts, setTotalParts] = useState(1);
  const [pendingPart, setPendingPart] = useState(1);
  const [globalCharacterList, setGlobalCharacterList] = useState<Character[]>([]);
  const [globalContextList, setGlobalContextList] = useState<ContextItem[]>([]);
  const [lastSceneSummary, setLastSceneSummary] = useState<string>("");

  const SCENES_PER_PART = 23; // 3 mins per part

  const generateScriptChunk = useCallback(async (
    targetPart: number,
    totalPartCount: number,
    numScenes: number,
    prevCharacters: Character[],
    prevContexts: ContextItem[],
    prevLastScene: string
  ): Promise<GeneratedContent> => {
    
    const isFirstPart = targetPart === 1;
    const isFinalPart = targetPart === totalPartCount;
    const randomSalt = Math.random().toString(36).substring(7) + Date.now();
    const resultLanguage = (hasVoice && voiceLanguage === 'English') ? 'ENGLISH' : 'VIETNAMESE';

    let characterTask = isFirstPart 
        ? `TASK 1: Create a list of characters based on: "${videoIdea}" and "${userSuggestions}". Define their names, roles, and detailed visual prompts for Whisk AI (Isolated on white background, head-to-toe, NO objects).`
        : `TASK 1: REUSE these established characters for consistency: ${JSON.stringify(prevCharacters)}. DO NOT invent new characters unless absolutely necessary for the plot.`;

    let contextTask = isFirstPart
        ? `TASK 2: Define key recurring environments/contexts for the story. Create detailed visual prompts for Whisk AI (Landscape, environment only).`
        : `TASK 2: REUSE these established contexts: ${JSON.stringify(prevContexts)}.`;

    const commonPrompt = `
You are a High-End Film Director and Senior Prompt Engineer for VEO 3.1. 
Your goal is to write PART ${targetPart} of a ${totalPartCount}-part cinematic script. 

**CREATIVITY & CONTEXTUAL FASHION MANDATE (SEED: ${randomSalt}):**
FOR EVERY GENERATION, YOU MUST EXPLORE A COMPLETELY UNIQUE ARTISTIC DIRECTION. 
- **OUTFIT DESIGN:** You MUST design outfits that are contextually perfect for the story idea. 
  * If the idea is "Camping", choose rugged, strong, or sexy outdoor wear (e.g., "distressed denim shorts with a tactical multi-pocket vest").
  * If the idea is "Luxury", choose high-fashion, sleek, or elegant attire.

**STRICT RULE: OBSESSIVE VISUAL DETAIL (MANDATORY)**
Every scene prompt MUST be an exhaustive visual world. Generic nouns are strictly FORBIDDEN.
1. **Characters & Action:** Describe exact muscle movements, the texture of skin/hair, and the precise velocity of action.
2. **Outfits (Consistency Anchor):** For EACH character, describe their outfit with granular detail (Material, color shade, wear-and-tear). This description MUST remain 100% identical in every scene of this part.
3. **Environment & Atmosphere:** Describe floor textures, wall materials, lighting sources, and air quality.
4. **Object Precision:** Use extremely specific descriptions for every object.
5. **Atomic Independence:** No pronouns like "he" or "she". Use full specific descriptions in every prompt.

**STRICT RULE: VOICEOVER & DIALOGUE (MANDATORY)**
- ${hasVoice ? `VOICEOVER IS ENABLED. For EACH scene in the "prompts" array, you MUST include the spoken dialogue at the end of the English prompt content.` : `VOICEOVER IS DISABLED. DO NOT include any dialogue in the prompts.`}
- IF voiceover is enabled, the dialogue MUST be in ${resultLanguage}.
- FORMAT for prompt content (if dialogue is enabled): "[English Visual Description] ... Dialog: '[The spoken lines in ${resultLanguage}]'".

**STRICT RULE: NO TRANSLATIONS IN VISUALS**
- EACH element in the "prompts" array MUST ONLY contain the RAW ENGLISH visual description and the Dialog part.
- DO NOT start with "Scene X" or "Cảnh X" inside the string.
- DO NOT include Vietnamese translations or bracketed text like "[Cảnh 1: ...]" inside the prompt content.

**STRICT RULE: NARRATIVE CONTINUITY**
- ${!isFinalPart ? "This is NOT the final part. The script MUST NOT END. The last scene MUST be a cliffhanger or transition." : "This IS the final part. Provide a satisfying conclusion."}
- ${!isFirstPart ? `Smoothly continue from: "${prevLastScene}".` : "Start the story."}

**TECHNICAL SPECS:**
- Generate EXACTLY ${numScenes} prompts.
- Visual prompts in ENGLISH ONLY.
- Dialogue in ${resultLanguage} (only if voiceover is enabled).
- Character descriptions and context descriptions in ${resultLanguage}.
- Return ONLY a valid JSON object.
`;

    const userPrompt = `
- Part Number: ${targetPart}
- Total Parts: ${totalPartCount}
- Scenes to Generate: ${numScenes}
- Idea: "${videoIdea}"
- Suggestions: "${userSuggestions}"
- Style: ${selectedCinematicStyle}
- Dialogue Enabled: ${hasVoice ? 'Yes' : 'No'}
- Dialogue Language: ${resultLanguage}
`;

    let finalError: unknown;
    let result: GeneratedContent | null = null;

    if ((selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
        try {
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: `${commonPrompt}\n\n${characterTask}\n${contextTask}\n\n**USER INPUT:**\n${userPrompt}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: window.GenAIType.OBJECT,
                        properties: {
                            characterList: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.OBJECT, properties: { name: { type: window.GenAIType.STRING }, role: { type: window.GenAIType.STRING }, description: { type: window.GenAIType.STRING }, whiskPrompt: { type: window.GenAIType.STRING } }, required: ["name", "role", "description", "whiskPrompt"] } },
                            contextList: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.OBJECT, properties: { name: { type: window.GenAIType.STRING }, description: { type: window.GenAIType.STRING }, whiskPrompt: { type: window.GenAIType.STRING } }, required: ["name", "description", "whiskPrompt"] } },
                            prompts: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } }
                        },
                        required: ["characterList", "contextList", "prompts"]
                    }
                },
            });
            result = JSON.parse(cleanJsonString(response.text)) as GeneratedContent;
        } catch (e) {
            console.warn("Gemini failed", e);
            if (selectedAIModel === 'gemini') throw e;
            finalError = e;
        }
    }

    if (!result && (selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: commonPrompt + "\n" + characterTask + "\n" + contextTask },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 1.0
                })
            });
            if (!response.ok) throw new Error('OpenAI failed');
            const data = await response.json();
            result = JSON.parse(cleanJsonString(data.choices[0].message.content)) as GeneratedContent;
        } catch (e) {
            console.warn("OpenAI failed", e);
            finalError = e;
        }
    }

    if (result) return result;
    throw finalError || new Error("Không thể tạo kịch bản.");
  }, [videoIdea, userSuggestions, selectedCinematicStyle, geminiApiKey, openaiApiKey, selectedAIModel, hasVoice, voiceLanguage]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const durationNum = parseFloat(duration);
      if (isNaN(durationNum) || durationNum <= 0) {
          alert("Vui lòng nhập thời lượng hợp lệ.");
          return;
      }

      setPendingPart(1);
      setLoading(true);
      setError(null);
      setGeneratedContent(null);
      setCharacterImages({});
      
      const totalSeconds = durationNum * 60;
      const totalScenesNeeded = Math.ceil(totalSeconds / 8);
      const partsNeeded = Math.ceil(totalScenesNeeded / SCENES_PER_PART);
      
      setTotalParts(partsNeeded);
      setCurrentPart(1);

      try {
          const numScenesInFirstPart = Math.min(SCENES_PER_PART, totalScenesNeeded);
          const result = await generateScriptChunk(1, partsNeeded, numScenesInFirstPart, [], [], "");
          
          setGeneratedContent(result);
          setGlobalCharacterList(result.characterList);
          setGlobalContextList(result.contextList);
          if (result.prompts.length > 0) {
              setLastSceneSummary(result.prompts[result.prompts.length - 1]);
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleNextPart = async () => {
    if (currentPart >= totalParts) return;
    
    const nextP = currentPart + 1;
    setPendingPart(nextP);
    setLoading(true);
    setError(null);
    setGeneratedContent(null);
    
    const durationNum = parseFloat(duration);
    const totalScenesNeeded = Math.ceil((durationNum * 60) / 8);
    const scenesSoFar = currentPart * SCENES_PER_PART;
    const remainingScenes = totalScenesNeeded - scenesSoFar;
    const scenesForThisPart = Math.min(SCENES_PER_PART, remainingScenes);

    try {
        const result = await generateScriptChunk(
            nextP, 
            totalParts, 
            scenesForThisPart, 
            globalCharacterList, 
            globalContextList, 
            lastSceneSummary
        );
        
        setGeneratedContent(result);
        setCurrentPart(nextP);
        if (result.prompts.length > 0) {
            setLastSceneSummary(result.prompts[result.prompts.length - 1]);
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateImage = useCallback(async (type: string, id: string | number, prompt: string, aspectRatio: '16:9' | '9:16') => {
    if (!geminiApiKey && !openaiApiKey) {
        setError("Vui lòng cài đặt ít nhất một API Key.");
        return;
    }

    const key = `${type}_${id}`;
    setCharacterImages(prev => ({
        ...prev,
        [key]: { isGenerating: true, error: undefined, imageUrl: prev[key]?.imageUrl }
    }));

    try {
        let imageUrl = '';
        const finalPrompt = selectedCinematicStyle !== 'Hoạt hình' 
            ? `Extremely detailed, high-end cinematic photograph, 8k resolution. ${prompt}`
            : `Vibrant 3D animation style, Pixar inspired, detailed render. ${prompt}`;

        if (geminiApiKey && (selectedAIModel === 'gemini' || selectedAIModel === 'auto')) {
             try {
                const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: finalPrompt }] },
                    config: { responseModalities: [window.GenAIModality.IMAGE] },
                });
                const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
                if (imagePart && imagePart.inlineData) {
                    imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                }
             } catch(e) { console.warn("Gemini Image Gen failed", e); }
        }

        if (!imageUrl && openaiApiKey && (selectedAIModel === 'openai' || (selectedAIModel === 'auto'))) {
             try {
                const response = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                    body: JSON.stringify({
                        model: 'dall-e-3',
                        prompt: finalPrompt,
                        n: 1,
                        size: '1024x1024', 
                        response_format: 'b64_json',
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
                }
             } catch(e) { console.warn("OpenAI Image Gen failed", e); }
        }

        if (!imageUrl) throw new Error("Không thể tạo ảnh. Vui lòng thử lại.");

        setCharacterImages(prev => ({
            ...prev,
            [key]: { isGenerating: false, imageUrl }
        }));

    } catch (err: any) {
        setCharacterImages(prev => ({
            ...prev,
            [key]: { isGenerating: false, error: err.message || "Lỗi tạo ảnh" }
        }));
    }
  }, [geminiApiKey, openaiApiKey, selectedCinematicStyle, selectedAIModel]);

  const handleDownload = () => {
      if(!generatedContent) return;
      const baseNum = (currentPart - 1) * SCENES_PER_PART;
      const text = generatedContent.prompts.map((p, idx) => `Scene ${baseNum + idx + 1}: ${p}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Part_${currentPart}_KichBan.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleCopyAll = () => {
      if (!generatedContent) return;
      const baseNum = (currentPart - 1) * SCENES_PER_PART;
      const allText = generatedContent.prompts.map((p, idx) => `Scene ${baseNum + idx + 1}: ${p}`).join('\n\n\n');
      navigator.clipboard.writeText(allText).then(() => {
          setCopiedAll(true);
          setTimeout(() => setCopiedAll(false), 2000);
      });
  };

  return (
    React.createElement("div", { className: "w-full h-full p-4" },
      lightboxImage && React.createElement(Lightbox, { imageUrl: lightboxImage, onClose: () => setLightboxImage(null) }),
      React.createElement("div", { className: "flex flex-col lg:flex-row gap-8" },
        // Left Column (Form)
        React.createElement("div", { className: "lg:w-1/3 space-y-6" },
            React.createElement("form", { onSubmit: handleSubmit, className: "bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl" },
                React.createElement("div", { className: "flex flex-col gap-4 mb-6" },
                    React.createElement("div", { className: "flex flex-wrap items-center gap-3" },
                        React.createElement("h3", { className: "text-xl font-bold text-white whitespace-nowrap" }, "Thiết lập Kịch bản"),
                        React.createElement("div", { className: "flex bg-gray-900 rounded p-1" },
                            React.createElement("button", { type: "button", onClick: () => setHasVoice(false), className: `px-3 py-1 text-[10px] uppercase tracking-wider rounded transition font-bold ${!hasVoice ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}` }, "Im lặng"),
                            React.createElement("button", { type: "button", onClick: () => setHasVoice(true), className: `px-3 py-1 text-[10px] uppercase tracking-wider rounded transition font-bold ${hasVoice ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'}` }, "Lồng tiếng")
                        )
                    ),
                    hasVoice && React.createElement("div", { className: "flex bg-gray-900 rounded p-1 animate-fade-in self-start" },
                        React.createElement("button", { type: "button", onClick: () => setVoiceLanguage('Vietnamese'), className: `px-4 py-1.5 text-[10px] uppercase tracking-widest rounded transition font-black ${voiceLanguage === 'Vietnamese' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}` }, "Tiếng Việt"),
                        React.createElement("button", { type: "button", onClick: () => setVoiceLanguage('English'), className: `px-4 py-1.5 text-[10px] uppercase tracking-widest rounded transition font-black ${voiceLanguage === 'English' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}` }, "Tiếng Anh")
                    )
                ),
                React.createElement("div", { className: "space-y-5" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-bold text-gray-400 mb-2" }, "Ý tưởng cốt truyện"),
                        React.createElement("textarea", { className: "w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white h-28 focus:border-cyan-500 outline-none transition-all", value: videoIdea, onChange: e => setVideoIdea(e.target.value), required: true, placeholder: "Ví dụ: Một phi hành gia lạc trên hành tinh kỳ lạ..." } as any)
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-bold text-gray-400 mb-2" }, "Chi tiết bổ sung"),
                        React.createElement("textarea", { className: "w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white h-20 focus:border-cyan-500 outline-none transition-all", value: userSuggestions, onChange: e => setUserSuggestions(e.target.value), placeholder: "Trang phục, tính cách nhân vật..." } as any)
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-bold text-gray-400 mb-2" }, "Thời lượng Video (Phút)"),
                        React.createElement("div", { className: "relative" },
                            React.createElement("input", { type: "number", step: "0.1", className: "w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-all", value: duration, onChange: e => setDuration(e.target.value), required: true, placeholder: "5" } as any),
                            React.createElement("span", { className: "absolute right-3 top-3 text-gray-600 text-xs font-bold" }, "PHÚT")
                        )
                    ),
                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1" }, "Số NV chính"),
                            React.createElement("input", { type: "number", className: "w-full bg-gray-900 border border-gray-700 rounded-xl p-2 text-white focus:border-cyan-500 outline-none", value: numMainCharacters, onChange: e => setNumMainCharacters(e.target.value), placeholder: "Auto" } as any)
                        ),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1" }, "Số NV phụ"),
                            React.createElement("input", { type: "number", className: "w-full bg-gray-900 border border-gray-700 rounded-xl p-2 text-white focus:border-cyan-500 outline-none", value: numSupportingCharacters, onChange: e => setNumSupportingCharacters(e.target.value), placeholder: "Auto" } as any)
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-bold text-gray-400 mb-2" }, "Phong cách phim"),
                        React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                            cinematicStyles.map(style => (
                                React.createElement("button", { key: style, type: "button", onClick: () => setSelectedCinematicStyle(style), className: `py-2 rounded text-[10px] font-black uppercase border transition-all ${selectedCinematicStyle === style ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/40' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}` }, style)
                            ))
                        )
                    ),
                    React.createElement("button", { type: "submit", disabled: loading, className: "w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 px-4 rounded-xl transition-all disabled:opacity-50 shadow-xl uppercase tracking-widest text-sm" }, loading ? "Đang xử lý..." : "Bắt đầu tạo kịch bản")
                )
            )
        ),

        // Right Column (Results)
        React.createElement("div", { className: "lg:w-2/3 min-w-0" },
            loading && React.createElement(Loader, { message: `Đang tạo Phần ${pendingPart}... Vui lòng đợi.` }),
            error && React.createElement("div", { className: "bg-red-900/20 border border-red-500 text-red-400 p-5 rounded-2xl mb-6 flex items-center gap-3" }, 
                React.createElement("span", { className: "text-2xl" }, "⚠️"),
                React.createElement("div", null,
                    React.createElement("p", { className: "font-bold" }, "Lỗi hệ thống"),
                    React.createElement("p", { className: "text-sm" }, error)
                )
            ),
            generatedContent && (
                React.createElement("div", { className: "space-y-10 h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-4 pb-20" },
                    
                    // Header Actions
                    React.createElement("div", { className: "sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-gray-800 shadow-2xl flex flex-wrap justify-between items-center gap-4" },
                        React.createElement("div", null,
                            React.createElement("h2", { className: "text-lg font-black text-white uppercase tracking-tighter" }, `PHẦN ${currentPart} / ${totalParts}`),
                            React.createElement("p", { className: "text-[10px] text-gray-500 font-bold uppercase" }, "Chi tiết & Liên kết kịch bản")
                        ),
                        React.createElement("div", { className: "flex gap-3" },
                            React.createElement("button", { onClick: handleDownload, className: "bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border border-gray-700 transition-all" }, "Tải .txt"),
                            React.createElement("button", { onClick: handleCopyAll, className: `px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg ${copiedAll ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}` }, 
                                copiedAll ? "Đã sao chép" : "Chép hết"
                            )
                        )
                    ),

                    // Character List
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-sm font-black text-yellow-500 mb-5 flex items-center gap-2 uppercase tracking-[0.2em]" }, 
                            React.createElement("span", { className: "w-2 h-4 bg-yellow-500 rounded-full" }),
                            "Thiết kế nhân vật"
                        ),
                        React.createElement("div", { className: "space-y-4" },
                            generatedContent.characterList.map((char, idx) => (
                                React.createElement(ResultCard, {
                                    key: `char_${idx}`,
                                    title: char.name,
                                    role: char.role,
                                    description: char.description,
                                    whiskPrompt: char.whiskPrompt,
                                    index: idx,
                                    onGenerateImage: (i, p, r) => handleGenerateImage('char', i, p, r),
                                    imageData: characterImages[`char_${idx}`] || {},
                                    onImageClick: setLightboxImage
                                })
                            ))
                        )
                    ),

                    // Context List
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-sm font-black text-green-500 mb-5 flex items-center gap-2 uppercase tracking-[0.2em]" }, 
                            React.createElement("span", { className: "w-2 h-4 bg-green-500 rounded-full" }),
                            "Thiết kế bối cảnh"
                        ),
                        React.createElement("div", { className: "space-y-4" },
                            generatedContent.contextList.map((ctx, idx) => (
                                React.createElement(ResultCard, {
                                    key: `ctx_${idx}`,
                                    title: ctx.name,
                                    description: ctx.description,
                                    whiskPrompt: ctx.whiskPrompt,
                                    index: idx,
                                    onGenerateImage: (i, p, r) => handleGenerateImage('ctx', i, p, r),
                                    imageData: characterImages[`ctx_${idx}`] || {},
                                    onImageClick: setLightboxImage
                                })
                            ))
                        )
                    ),

                    // Video Prompts
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-sm font-black text-cyan-500 mb-5 flex items-center gap-2 uppercase tracking-[0.2em]" }, 
                            React.createElement("span", { className: "w-2 h-4 bg-cyan-500 rounded-full" }),
                            "Chuỗi Prompt Video (VEO 3.1)"
                        ),
                        React.createElement("div", null,
                            generatedContent.prompts.map((p, idx) => (
                                React.createElement(PromptCard, { 
                                    key: idx, 
                                    prompt: p, 
                                    promptNumber: ((currentPart - 1) * SCENES_PER_PART) + idx + 1 
                                })
                            ))
                        )
                    ),

                    // Pagination Footer
                    currentPart < totalParts && (
                        React.createElement("div", { className: "pt-10 pb-20 border-t border-gray-800" },
                            React.createElement("button", { 
                                onClick: handleNextPart,
                                className: "w-full py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black rounded-2xl shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest flex items-center justify-center gap-4"
                            }, 
                                React.createElement("span", { className: "text-xl" }, "✨"),
                                `Tiếp tục tạo PHẦN ${currentPart + 1} / ${totalParts}`,
                                React.createElement("span", { className: "text-xl" }, "✨")
                            )
                        )
                    )
                )
            )
        )
      )
    )
  );
};

export default VietKichBanApp;

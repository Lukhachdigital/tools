
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
    // Try to extract JSON from code blocks if present
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1];
    }
    return cleaned.trim();
};

// --- COMPONENTS ---
const Loader = (): React.ReactElement => {
  return (
    React.createElement("div", { className: "flex items-center justify-center p-4" },
      React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }),
      React.createElement("p", { className: "ml-3 text-gray-300" }, "AI đang viết kịch bản...")
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
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm",
      onClick: onClose
    };

    const innerDivProps: React.HTMLAttributes<HTMLDivElement> = {
      className: "relative w-full max-w-4xl max-h-[90vh] p-4",
      onClick: (e) => e.stopPropagation()
    };

    return (
      React.createElement("div",
        outerDivProps,
        React.createElement("div",
          innerDivProps,
          React.createElement("img", { src: imageUrl, alt: "Generated Content", className: "w-full h-full object-contain rounded-lg shadow-2xl" }),
          React.createElement("div", { className: "absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4" },
              React.createElement("button", {
                  onClick: handleSave,
                  className: "px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              }, "Lưu ảnh"),
              React.createElement("button", {
                  onClick: onClose,
                  className: "px-6 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
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
    React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-lg border border-gray-700" },
       React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3" },
         React.createElement("div", { className: "flex items-center gap-3" },
           React.createElement("h4", { className: "text-lg font-bold text-gray-100" }, title),
           role && React.createElement("span", {
               className: `text-xs font-semibold px-2.5 py-1 rounded-full ${role === 'Nhân vật chính' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-600/50 text-gray-300'}`
           }, role)
         ),
         React.createElement("div", { className: "flex items-center gap-2 flex-shrink-0" },
            React.createElement("button", { onClick: () => setAspectRatio('16:9'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '16:9' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Ngang"),
            React.createElement("button", { onClick: () => setAspectRatio('9:16'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '9:16' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Dọc"),
            React.createElement("button", {
                onClick: () => onGenerateImage(index, whiskPrompt, aspectRatio),
                disabled: isGenerating,
                className: "bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-4 rounded-md disabled:opacity-50 disabled:cursor-wait transition"
            }, isGenerating ? "Đang tạo..." : "Tạo ảnh")
         )
       ),
       React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
         React.createElement("div", null,
           React.createElement("p", { className: "text-gray-300 text-sm mb-4" }, description),
           React.createElement("div", null,
             React.createElement("p", { className: "font-semibold text-sm text-indigo-300 mb-2" }, "Prompt tạo ảnh (Whisk AI):"),
             React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
               React.createElement("p", { className: "text-gray-200 text-xs break-words pr-24" }, whiskPrompt),
               React.createElement("button", {
                 onClick: () => copyToClipboard(whiskPrompt),
                 className: `absolute top-2 right-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none disabled:bg-green-600 ${copied ? 'bg-green-600' : ''}`,
               }, copied ? 'Đã sao chép' : 'Sao chép')
             )
           )
         ),
         React.createElement("div", { className: `w-full ${imageContainerAspectRatio} bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 transition-all` },
            isGenerating && React.createElement("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-green-400" }),
            error && React.createElement("p", { className: "text-red-400 text-xs text-center p-2" }, error),
            imageUrl && !isGenerating && !error && (
                React.createElement("img", {
                    src: imageUrl,
                    alt: `Generated result`,
                    className: "w-full h-full object-cover rounded-md cursor-pointer hover:scale-105 transition-transform duration-300",
                    onClick: () => onImageClick(imageUrl)
                })
            ),
            !isGenerating && !error && !imageUrl && React.createElement("p", { className: "text-gray-500 text-xs" }, "Ảnh sẽ hiện ở đây")
         )
       )
    )
  );
};

const PromptCard = ({ prompt, promptNumber }: { prompt: string; promptNumber: number }): React.ReactElement => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    React.createElement("div", { className: "relative bg-gray-700 p-4 rounded-md border border-gray-600 mb-4" },
      React.createElement("h4", { className: "text-cyan-400 font-bold text-xs mb-1" }, `Cảnh ${promptNumber}`),
      React.createElement("p", { className: "text-gray-200 text-sm break-words pr-24" }, prompt),
      React.createElement("button", {
        onClick: () => copyToClipboard(prompt),
        className: `absolute top-2 right-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-green-600 ${copied ? 'bg-green-600' : ''}`,
      }, copied ? 'Đã sao chép' : 'Sao chép')
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

  const generateScript = useCallback(async (
    videoIdea: string,
    userSuggestions: string,
    durationInMinutes: number,
    cinematicStyle: string,
    numMain: number | null,
    numSupporting: number | null,
    hasVoice: boolean,
    voiceLanguage: string
  ): Promise<GeneratedContent> => {
    
    const numberOfScenes = Math.ceil((durationInMinutes * 60) / 8);

    const whiskStyleInstruction = cinematicStyle === "Hoạt hình"
      ? "The style MUST be animated."
      : "The style MUST be photorealistic and NOT animated.";

    let mainCharInstruction = '';
    if (numMain !== null && !isNaN(numMain) && numMain >= 0) {
      mainCharInstruction = `You MUST create exactly ${numMain} main character(s) ('Nhân vật chính').`;
    }

    let supCharInstruction = '';
    if (numSupporting !== null && !isNaN(numSupporting) && numSupporting >= 0) {
      supCharInstruction = `You MUST create exactly ${numSupporting} supporting character(s) ('Nhân vật phụ').`;
    }

    let characterInstruction;
    if (mainCharInstruction || supCharInstruction) {
      characterInstruction = `- Create a list of characters. ${[mainCharInstruction, supCharInstruction].filter(Boolean).join(' ')}`;
    } else {
      characterInstruction = "- Create a list of characters, identifying main and supporting roles.";
    }

    let voicePromptInstruction = "";
    if (hasVoice) {
        voicePromptInstruction = `
        **Dialogue/Voiceover**: Include dialogue or voiceover for appropriate scenes.
           - Format: Visual description... Audio: [Character Name/Voiceover]: '[Dialogue text]'.
           - Spoken language MUST BE **${voiceLanguage === 'Vietnamese' ? 'VIETNAMESE' : 'ENGLISH'}**.
           - Rest of the prompt MUST remain in ENGLISH.
        `;
    } else {
        voicePromptInstruction = `
        **Dialogue/Voiceover**: NO DIALOGUE. Do NOT include spoken words or "Audio:" tags.
        `;
    }

    const commonPrompt = `
You are an expert director and prompt engineer. 

**CREATIVITY MANDATE (ABSOLUTE):** You MUST generate a COMPLETELY NEW and UNIQUE story concept, unique characters with original names, and a fresh sequence of events for EVERY request. 
**RADICAL VARIATION REQUIRED:** Even if the user input is identical to a previous one, you MUST provide a radically different creative approach. This includes:
- **PLOT & SCRIPT:** Entirely different narratives, twists, and structures.
- **COSTUMES:** Every generation MUST feature completely different styles of clothing (e.g., from formal wear to casual beachwear to historical rags).
- **COLORS:** Use radically diverse and unique color palettes for costumes and environments in every response.
Repetitive, similar, or formulaic responses are strictly prohibited.

**CRITICAL RULE: REALISM AND AUTHENTICITY**
1. **ABSOLUTE REALISM:** Unless the style is "Viễn tưởng" (Sci-fi), everything generated—characters, items, actions, settings—MUST be strictly grounded in reality and present-day logic. ABSOLUTELY NO futuristic tech, magic, or fantasy elements.
2. **THEMATIC CONSISTENCY:** Adhere deeply to the logic of "${cinematicStyle}".

**Task 1: Character List & Whisk Prompts**
${characterInstruction}
- For each character:
    1.  **name**: Character name.
    2.  **role**: 'Nhân vật chính' or 'Nhân vật phụ'.
    3.  **description**: Detailed VIETNAMESE description.
    4.  **whiskPrompt**: ENGLISH prompt for Whisk AI.
        **STRICT RULES FOR CHARACTER WHISK PROMPT:**
        a. **Identity Accuracy**: You MUST use the exact entity mentioned in the Idea: "${videoIdea}". If the idea says "girl", the character MUST be a "girl". DO NOT use other terms.
        b. **Full-Body Shot (MANDATORY)**: The prompt MUST explicitly describe the character from HEAD TO TOE. Describe hair, full clothing, and shoes. It MUST be a 'full-body shot' where the character is visible from head to toe.
        c. **Omit Facial Features (CRITICAL)**: Describe ONLY the head shape and hair style. DO NOT describe eyes, nose, mouth, skin texture of the face, or any facial detail. 
        **IMPORTANT**: DO NOT write phrases like "no face", "without facial details", or "không mô tả mặt" in the prompt. Simply stop describing once you reach the neck/hair and proceed to describe the rest of the body.
        d. **No Accessories**: ABSOLUTELY NO handheld items, bags, weapons, or secondary objects.
        e. **Background**: MUST be 'solid white background'.
        f. **Style**: ${whiskStyleInstruction}
        g. **User Suggestions**: Strictly apply these additional appearance details (omitting facial features): "${userSuggestions}".

**Task 2: Context/Setting List**
- Identify key recurring locations and create a list of contexts.
- For each context:
    1. **name**: Setting name.
    2. **description**: Detailed VIETNAMESE description.
    3. **whiskPrompt**: ENGLISH prompt for Whisk AI describing the environment ONLY.
    4. **User Suggestions**: Incorporate relevant suggestions: "${userSuggestions}".

**Task 3: Scene Prompts (VEO 3.1)**
- Generate exactly ${numberOfScenes} prompts.
- **CRITICAL PROMPT REQUIREMENTS (MANDATORY):**
    Every single prompt MUST describe:
    a. **Character Identity**: Match the exact character from Task 1.
    b. **Character Emotion & Action**: Focused expression and movement (but NEVER describe eyes/nose/mouth details).
    c. **Environment**: Extensive detail of the setting in EVERY prompt.
    d. **Character Clothing**: Repeat the full-body outfit description exactly as defined in Task 1 for every scene.
- Visual descriptions in ENGLISH.
- ${voicePromptInstruction}
`;

    const userPrompt = `
- Idea: "${videoIdea}"
- User Suggestions/Reminders: "${userSuggestions}"
- Style: "${cinematicStyle}"
- Duration: ${durationInMinutes} minutes.
- Timestamp Seed: ${Date.now()}
`;
    const systemPrompt = `${commonPrompt}\n\nGenerate JSON: { "characterList": [ ... ], "contextList": [ ... ], "prompts": [ ... ] }`;

    let finalError: unknown;
    let result: GeneratedContent | null = null;

    if ((selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
        try {
            if (!geminiApiKey) throw new Error("Gemini API Key chưa được cài đặt.");
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            const schema = {
                type: window.GenAIType.OBJECT,
                properties: {
                    characterList: {
                        type: window.GenAIType.ARRAY,
                        items: {
                            type: window.GenAIType.OBJECT,
                            properties: {
                                name: { type: window.GenAIType.STRING },
                                role: { type: window.GenAIType.STRING },
                                description: { type: window.GenAIType.STRING },
                                whiskPrompt: { type: window.GenAIType.STRING }
                            },
                            required: ["name", "role", "description", "whiskPrompt"]
                        }
                    },
                    contextList: {
                        type: window.GenAIType.ARRAY,
                        items: {
                            type: window.GenAIType.OBJECT,
                            properties: {
                                name: { type: window.GenAIType.STRING },
                                description: { type: window.GenAIType.STRING },
                                whiskPrompt: { type: window.GenAIType.STRING }
                            },
                            required: ["name", "description", "whiskPrompt"]
                        }
                    },
                    prompts: {
                        type: window.GenAIType.ARRAY,
                        items: { type: window.GenAIType.STRING },
                    }
                },
                required: ["characterList", "contextList", "prompts"]
            };

            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: `${commonPrompt}\n\n**User Input:**\n${userPrompt}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
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
            if (!openaiApiKey) throw new Error("OpenAI API Key chưa được cài đặt.");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                    response_format: { type: 'json_object' }
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
    throw finalError || new Error("Không thể tạo kịch bản. Vui lòng kiểm tra API Key.");

  }, [geminiApiKey, openaiApiKey, selectedAIModel]);
  
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

    let finalPrompt = prompt;
    if (selectedCinematicStyle !== 'Hoạt hình') {
        finalPrompt = `ultra photorealistic, realistic photograph, cinematic shot. ${prompt}. The final image must be absolutely realistic, not animated, not 3D, not a cartoon, not fantasy.`;
    }
    
    try {
        let imageUrl = '';
        if (geminiApiKey && !imageUrl && (selectedAIModel === 'gemini' || selectedAIModel === 'auto')) {
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
                } else {
                     const responseImagen = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: finalPrompt,
                        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: aspectRatio },
                    });
                    if (responseImagen.generatedImages?.[0]?.image?.imageBytes) {
                        imageUrl = `data:image/png;base64,${responseImagen.generatedImages[0].image.imageBytes}`;
                    }
                }
             } catch(e) { console.warn("Gemini Image Gen failed", e); }
        }

        if (openaiApiKey && !imageUrl && (selectedAIModel === 'openai' || (selectedAIModel === 'auto'))) {
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
                        quality: 'hd',
                        style: 'vivid'
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
                }
             } catch(e) { console.warn("OpenAI Image Gen failed", e); }
        }

        if (!imageUrl) throw new Error("Không thể tạo ảnh.");

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

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setGeneratedContent(null);
      setCharacterImages({});

      try {
          const durationNum = parseFloat(duration) || 5;
          const numMain = numMainCharacters ? parseInt(numMainCharacters) : null;
          const numSup = numSupportingCharacters ? parseInt(numSupportingCharacters) : null;
          
          const result = await generateScript(videoIdea, userSuggestions, durationNum, selectedCinematicStyle, numMain, numSup, hasVoice, voiceLanguage);
          setGeneratedContent(result);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleDownload = () => {
      if(!generatedContent) return;
      const text = generatedContent.prompts.join('\n\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kich_ban_veo.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleCopyAll = () => {
      if (!generatedContent) return;
      const allText = generatedContent.prompts.map((p, idx) => `Scene ${idx + 1}: ${p}`).join('\n\n\n');
      navigator.clipboard.writeText(allText).then(() => {
          setCopiedAll(true);
          setTimeout(() => setCopiedAll(false), 2000);
      });
  };

  return (
    React.createElement("div", { className: "w-full h-full p-4" },
      lightboxImage && React.createElement(Lightbox, { imageUrl: lightboxImage, onClose: () => setLightboxImage(null) }),
      React.createElement("div", { className: "flex flex-col lg:flex-row gap-8" },
        React.createElement("div", { className: "lg:w-1/3 space-y-6" },
            React.createElement("form", { onSubmit: handleSubmit, className: "bg-gray-800 p-6 rounded-lg border border-gray-700" },
                React.createElement("div", { className: "flex flex-wrap items-center gap-3 mb-4" },
                    React.createElement("h3", { className: "text-xl font-bold text-white whitespace-nowrap" }, "Thiết lập Kịch bản"),
                    React.createElement("div", { className: "flex bg-gray-700 rounded p-1" },
                        React.createElement("button", { type: "button", onClick: () => setHasVoice(false), className: `px-3 py-1 text-xs rounded transition font-semibold ${!hasVoice ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-white'}` }, "Không thoại"),
                        React.createElement("button", { type: "button", onClick: () => setHasVoice(true), className: `px-3 py-1 text-xs rounded transition font-semibold ${hasVoice ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}` }, "Có thoại")
                    ),
                    React.createElement("div", { className: `flex bg-gray-700 rounded p-1 transition-opacity ${!hasVoice ? 'opacity-50 pointer-events-none' : 'opacity-100'}` },
                        React.createElement("button", { type: "button", onClick: () => setVoiceLanguage('Vietnamese'), className: `px-3 py-1 text-xs rounded transition font-semibold ${voiceLanguage === 'Vietnamese' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}` }, "Tiếng Việt"),
                        React.createElement("button", { type: "button", onClick: () => setVoiceLanguage('English'), className: `px-3 py-1 text-xs rounded transition font-semibold ${voiceLanguage === 'English' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}` }, "Tiếng Anh")
                    )
                ),
                React.createElement("div", { className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Ý tưởng Video"),
                        React.createElement("textarea", { className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-24", value: videoIdea, onChange: e => setVideoIdea(e.target.value), required: true, placeholder: "Ví dụ: Một cô gái đang..." } as any)
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Gợi ý / Nhắc nhở thêm"),
                        React.createElement("textarea", { className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-20", value: userSuggestions, onChange: e => setUserSuggestions(e.target.value), placeholder: "Ví dụ: Áo màu đỏ rực, tóc đen dài..." } as any)
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Thời lượng (phút)"),
                        React.createElement("input", { type: "number", className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white", value: duration, onChange: e => setDuration(e.target.value), required: true, placeholder: "5" } as any)
                    ),
                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Số nhân vật chính"),
                            React.createElement("input", { type: "number", className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white", value: numMainCharacters, onChange: e => setNumMainCharacters(e.target.value), placeholder: "Tùy chọn" } as any)
                        ),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Số nhân vật phụ"),
                            React.createElement("input", { type: "number", className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white", value: numSupportingCharacters, onChange: e => setNumSupportingCharacters(e.target.value), placeholder: "Tùy chọn" } as any)
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Phong cách"),
                        React.createElement("div", { className: "flex flex-wrap gap-2" },
                            cinematicStyles.map(style => (
                                React.createElement("button", { key: style, type: "button", onClick: () => setSelectedCinematicStyle(style), className: `px-3 py-1 rounded text-sm border transition ${selectedCinematicStyle === style ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}` }, style)
                            ))
                        )
                    ),
                    React.createElement("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50" }, loading ? "Đang tạo..." : "Tạo Kịch Bản")
                )
            )
        ),
        React.createElement("div", { className: "lg:w-2/3" },
            loading && React.createElement(Loader),
            error && React.createElement("div", { className: "bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4" }, error),
            generatedContent && (
                React.createElement("div", { className: "space-y-8 h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar pr-2" },
                    React.createElement("div", { className: "flex gap-4" },
                        React.createElement("button", { onClick: handleDownload, className: "flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold" }, "Tải xuống (.txt)"),
                        React.createElement("button", { onClick: handleCopyAll, className: "flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-bold" }, copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ Prompt")
                    ),
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-xl font-bold text-yellow-400 mb-4" }, "Danh sách Nhân vật"),
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
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-xl font-bold text-green-400 mb-4" }, "Danh sách Bối cảnh"),
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
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-xl font-bold text-cyan-400 mb-4" }, "Chuỗi Prompt Video (VEO 3.1)"),
                        React.createElement("div", null,
                            generatedContent.prompts.map((p, idx) => (
                                React.createElement(PromptCard, { key: idx, prompt: p, promptNumber: idx + 1 })
                            ))
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

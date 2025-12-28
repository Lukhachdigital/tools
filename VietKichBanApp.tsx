
import React, { useState, useCallback } from 'react';

// --- TYPES ---
interface Character {
  name: string;
  role: string;
  description: string;
  whiskPrompt: string;
}
interface GeneratedContent {
  characterList: Character[];
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
      link.download = `character-image-${Date.now()}.png`;
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
          React.createElement("img", { src: imageUrl, alt: "Generated Character", className: "w-full h-full object-contain rounded-lg shadow-2xl" }),
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

const CharacterCard = ({ character, characterIndex, onGenerateImage, imageData, onImageClick }: {
    character: Character;
    characterIndex: number;
    onGenerateImage: (index: number, prompt: string, ratio: '16:9' | '9:16') => void;
    imageData: { imageUrl?: string; isGenerating?: boolean; error?: string; };
    onImageClick: (url: string) => void;
}): React.ReactElement => {
  const [copied, setCopied] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9'); // Default to Landscape

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
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
           React.createElement("h4", { className: "text-lg font-bold text-gray-100" }, character.name),
           React.createElement("span", {
               className: `text-xs font-semibold px-2.5 py-1 rounded-full ${character.role === 'Nhân vật chính' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-600/50 text-gray-300'}`
           }, character.role)
         ),
         React.createElement("div", { className: "flex items-center gap-2 flex-shrink-0" },
            React.createElement("button", { onClick: () => setAspectRatio('16:9'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '16:9' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Ngang"),
            React.createElement("button", { onClick: () => setAspectRatio('9:16'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '9:16' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Dọc"),
            React.createElement("button", {
                onClick: () => onGenerateImage(characterIndex, character.whiskPrompt, aspectRatio),
                disabled: isGenerating,
                className: "bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-4 rounded-md disabled:opacity-50 disabled:cursor-wait transition"
            }, isGenerating ? "Đang tạo..." : "Tạo ảnh")
         )
       ),
       React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
         React.createElement("div", null,
           React.createElement("p", { className: "text-gray-300 text-sm mb-4" }, character.description),
           React.createElement("div", null,
             React.createElement("p", { className: "font-semibold text-sm text-indigo-300 mb-2" }, "Prompt tạo ảnh nhân vật (Whisk AI):"),
             React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
               React.createElement("p", { className: "text-gray-200 text-xs break-words pr-24" }, character.whiskPrompt),
               React.createElement("button", {
                 onClick: () => copyToClipboard(character.whiskPrompt),
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
                    alt: `Generated image of ${character.name}`,
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
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    React.createElement("div", { className: "relative bg-gray-700 p-4 rounded-md border border-gray-600 mb-4" },
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
  const [duration, setDuration] = useState('');
  const [numMainCharacters, setNumMainCharacters] = useState('');
  const [numSupportingCharacters, setNumSupportingCharacters] = useState('');
  const [selectedCinematicStyle, setSelectedCinematicStyle] = useState('Hiện đại');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterImages, setCharacterImages] = useState<{ [key: number]: { imageUrl?: string; isGenerating?: boolean; error?: string; } }>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // New States for Voice Options
  const [hasVoice, setHasVoice] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'Vietnamese' | 'English'>('Vietnamese');

  const generateScript = useCallback(async (
    videoIdea: string,
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
      characterInstruction = `- Create a list of characters for the story. ${[mainCharInstruction, supCharInstruction].filter(Boolean).join(' ')}`;
    } else {
      characterInstruction = "- Create a list of all characters for the story, identifying main and supporting roles.";
    }

    // Voice Instruction Logic
    let voicePromptInstruction = "";
    if (hasVoice) {
        voicePromptInstruction = `
        **Dialogue/Voiceover**: The user has requested a script WITH DIALOGUE.
           - You MUST include a dialogue line or voiceover for every prompt where appropriate.
           - Format: End the visual description with " Audio: [Character Name/Voiceover]: '[The Dialogue]'."
           - The spoken language inside the single quotes '' MUST BE **${voiceLanguage === 'Vietnamese' ? 'VIETNAMESE' : 'ENGLISH'}**.
           - The rest of the prompt (visual description) MUST remain in ENGLISH.
        `;
    } else {
        voicePromptInstruction = `
        **Dialogue/Voiceover**: The user has requested NO DIALOGUE (Silent/Music only).
           - Do NOT include any spoken words, dialogue lines, or "Audio:" tags specifying speech.
           - The prompt must be purely visual.
        `;
    }


    const commonPrompt = `
You are an expert Hollywood screenwriter and director, tasked with creating a concept for an epic, profound, and thrilling film. 

**CREATIVITY MANDATE:** Your outputs must exhibit a high degree of creativity and uniqueness. For every new request, generate a completely new and different story, a unique set of characters with original names, and a fresh sequence of prompts.

**CRITICAL RULE: REALISM AND AUTHENTICITY**
1. **NO FANTASY/SCIFI (UNLESS SELECTED):** Unless the selected "Cinematic Style" is "Viễn tưởng" (Sci-fi), everything you generate—characters, items, actions, and settings—MUST be strictly grounded in reality, present-day logic, or historical accuracy related to the style. ABSOLUTELY NO futuristic tech, magical elements, or unreal/illusionary concepts for "Hiện đại", "Điện ảnh", "Tiền sử", "Hoạt hình", or "Hài hước". 
2. **THEMATIC CONSISTENCY:** If the style is "${cinematicStyle}", adhere deeply to its era and logic.

**Task 1: Character Development & Whisk Prompts**
${characterInstruction}
- For each character, you will create an object:
    1.  **name**: Unique and creative character name.
    2.  **role**: 'Nhân vật chính' or 'Nhân vật phụ'.
    3.  **description**: Detailed description in VIETNAMESE (Appearance, clothing, key traits).
    4.  **whiskPrompt**: A detailed English prompt for Whisk AI.
        **STRICT WHISK PROMPT RULES:**
        a. **Style**: ${whiskStyleInstruction}
        b. **Background**: The background MUST be a 'solid white background'. 
        c. **Pose & Composition**: The character MUST be standing straight, facing the camera directly ('full-body shot', 'standing straight facing camera'). 
        d. **Content**: Describe ONLY physical appearance, hair, facial features, and specific CLOTHING (colors/materials).
        e. **EMOTION**: You MUST describe the character's EMOTION (e.g., 'looking determined', 'with a subtle smile', 'looking exhausted').
        f. **PROHIBITION**: ABSOLUTELY NO accessories, NO handheld items (no bags, no phones, no tools, no weapons), and NO background scenery. Focus purely on the person.

**Task 2: Prompt Generation for VEO 3.1**
- Generate exactly ${numberOfScenes} prompts (8s per scene).
- **CRITICAL VEO PROMPT REQUIREMENTS:**
    1. **MANDATORY CONTENT:** Every prompt MUST describe the following five elements in detail:
       a. **Character Emotion & Facial Expression**: Be very specific.
       b. **Character Clothing**: Describe the outfit accurately in EVERY scene.
       c. **Objects/Items**: Describe any physical items appearing in the scene (shape, color, material).
       d. **Setting/Background Context**: Where is this happening?
       e. **Environment/Atmosphere**: Lighting, weather, mood of the surroundings.
    2. **Consistency**: Use identical descriptions for recurring locations/clothing to ensure visual continuity.
    3. **Language**: Visual descriptions in ENGLISH. 
    4. ${voicePromptInstruction}
`;

    const userPrompt = `
- Idea: "${videoIdea}"
- Cinematic Style: "${cinematicStyle}"
- Total Duration: Approximately ${durationInMinutes} minutes.
`;
    const systemPrompt = `${commonPrompt}\n\nGenerate a JSON object that strictly adheres to the following structure: { "characterList": [ ... ], "prompts": [ ... ] }`;

    let finalError: unknown;
    let result: GeneratedContent | null = null;

    // 1. Try Gemini (Priority)
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
                    prompts: {
                        type: window.GenAIType.ARRAY,
                        items: { type: window.GenAIType.STRING },
                    }
                },
                required: ["characterList", "prompts"]
            };

            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: `${commonPrompt}\n\n**User Input:**\n${userPrompt}\n\nGenerate a JSON object that strictly adheres to the provided schema.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });
            const jsonStr = cleanJsonString(response.text);
            result = JSON.parse(jsonStr) as GeneratedContent;
        } catch (e) {
            console.warn("Gemini failed", e);
            if (selectedAIModel === 'gemini') throw e;
            finalError = e;
        }
    }

    // 2. Try OpenAI (Fallback)
    if (!result && (selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
        try {
            if (!openaiApiKey) throw new Error("OpenAI API Key chưa được cài đặt.");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenAI failed');
            const data = await response.json();
            const jsonText = cleanJsonString(data.choices[0].message.content);
            result = JSON.parse(jsonText) as GeneratedContent;
        } catch (e) {
            console.warn("OpenAI failed", e);
            finalError = e;
        }
    }

    if (result) return result;
    throw finalError || new Error("Không thể tạo kịch bản từ bất kỳ API nào. Vui lòng kiểm tra API Key.");

  }, [geminiApiKey, openaiApiKey, selectedAIModel]);
  
  const handleGenerateCharacterImage = useCallback(async (characterIndex: number, prompt: string, aspectRatio: '16:9' | '9:16') => {
    if (!geminiApiKey && !openaiApiKey) {
        setError("Vui lòng cài đặt ít nhất một API Key.");
        return;
    }

    setCharacterImages(prev => ({
        ...prev,
        [characterIndex]: { isGenerating: true, error: undefined, imageUrl: prev[characterIndex]?.imageUrl }
    }));

    let finalPrompt = prompt;
    if (selectedCinematicStyle !== 'Hoạt hình') {
        finalPrompt = `ultra photorealistic, realistic photograph, cinematic shot. ${prompt}. The final image must be absolutely realistic, not animated, not 3D, not a cartoon, not fantasy.`;
    }
    
    try {
        let imageUrl = '';
        
        // Priority: Gemini -> OpenAI for IMAGE Generation

        // 1. Try Gemini (Nano Banana Image)
        if (geminiApiKey && !imageUrl && (selectedAIModel === 'gemini' || selectedAIModel === 'auto')) {
             try {
                const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: finalPrompt }] },
                    config: { 
                        responseModalities: [window.GenAIModality.IMAGE] 
                    },
                });
                // Check for image part
                const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
                if (imagePart && imagePart.inlineData) {
                    imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                } else {
                    // Fallback to Imagen if Nano Banana returns no image
                     const responseImagen = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: finalPrompt,
                        config: {
                            numberOfImages: 1,
                            outputMimeType: 'image/png',
                            aspectRatio: aspectRatio,
                        },
                    });
                    if (responseImagen.generatedImages?.[0]?.image?.imageBytes) {
                        imageUrl = `data:image/png;base64,${responseImagen.generatedImages[0].image.imageBytes}`;
                    }
                }
             } catch(e) { console.warn("Gemini Image Gen failed", e); }
        }

        // 2. Try OpenAI (DALL-E 3)
        if (openaiApiKey && !imageUrl && (selectedAIModel === 'openai' || selectedAIModel === 'auto')) {
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

        if (!imageUrl) throw new Error("Không thể tạo ảnh từ bất kỳ API nào.");

        setCharacterImages(prev => ({
            ...prev,
            [characterIndex]: { isGenerating: false, imageUrl }
        }));

    } catch (err: any) {
        setCharacterImages(prev => ({
            ...prev,
            [characterIndex]: { isGenerating: false, error: err.message || "Lỗi tạo ảnh" }
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
          
          const result = await generateScript(videoIdea, durationNum, selectedCinematicStyle, numMain, numSup, hasVoice, voiceLanguage);
          setGeneratedContent(result);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleDownload = () => {
      if(!generatedContent) return;
      const text = `--- NHÂN VẬT ---\n${generatedContent.characterList.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n')}\n\n--- KỊCH BẢN ---\n${generatedContent.prompts.map((p, idx) => `Scene ${idx + 1}: ${p}`).join('\n\n')}`;
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
      const allText = generatedContent.prompts.join('\n\n\n');
      navigator.clipboard.writeText(allText).then(() => setCopiedAll(true));
  };

  return (
    React.createElement("div", { className: "w-full h-full p-4" },
      lightboxImage && React.createElement(Lightbox, { imageUrl: lightboxImage, onClose: () => setLightboxImage(null) }),
      React.createElement("div", { className: "flex flex-col lg:flex-row gap-8" },
        // Left Panel
        React.createElement("div", { className: "lg:w-1/3 space-y-6" },
            React.createElement("form", { onSubmit: handleSubmit, className: "bg-gray-800 p-6 rounded-lg border border-gray-700" },
                
                React.createElement("div", { className: "flex flex-wrap items-center gap-3 mb-4" },
                    React.createElement("h3", { className: "text-xl font-bold text-white whitespace-nowrap" }, "Thiết lập Kịch bản"),
                    
                    // Voice Toggle
                    React.createElement("div", { className: "flex bg-gray-700 rounded p-1" },
                        React.createElement("button", {
                            type: "button",
                            onClick: () => setHasVoice(false),
                            className: `px-3 py-1 text-xs rounded transition font-semibold ${!hasVoice ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-white'}`
                        }, "Không thoại"),
                        React.createElement("button", {
                            type: "button",
                            onClick: () => setHasVoice(true),
                            className: `px-3 py-1 text-xs rounded transition font-semibold ${hasVoice ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`
                        }, "Có thoại")
                    ),

                    // Language Toggle
                    React.createElement("div", { className: `flex bg-gray-700 rounded p-1 transition-opacity ${!hasVoice ? 'opacity-50 pointer-events-none' : 'opacity-100'}` },
                        React.createElement("button", {
                            type: "button",
                            onClick: () => setVoiceLanguage('Vietnamese'),
                            className: `px-3 py-1 text-xs rounded transition font-semibold ${voiceLanguage === 'Vietnamese' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`
                        }, "Tiếng Việt"),
                        React.createElement("button", {
                            type: "button",
                            onClick: () => setVoiceLanguage('English'),
                            className: `px-3 py-1 text-xs rounded transition font-semibold ${voiceLanguage === 'English' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`
                        }, "Tiếng Anh")
                    )
                ),

                React.createElement("div", { className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Ý tưởng Video"),
                        React.createElement("textarea", { 
                            className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-24", 
                            value: videoIdea,
                            onChange: e => setVideoIdea(e.target.value),
                            required: true,
                            placeholder: "Ví dụ: Cuộc phiêu lưu của chú mèo máy..."
                        } as any)
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Thời lượng (phút)"),
                        React.createElement("input", { 
                            type: "number",
                            className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white", 
                            value: duration,
                            onChange: e => setDuration(e.target.value),
                            required: true,
                            placeholder: "5"
                        } as any)
                    ),
                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Số nhân vật chính"),
                            React.createElement("input", { 
                                type: "number",
                                className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white", 
                                value: numMainCharacters,
                                onChange: e => setNumMainCharacters(e.target.value),
                                placeholder: "Tùy chọn"
                            } as any)
                        ),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Số nhân vật phụ"),
                            React.createElement("input", { 
                                type: "number",
                                className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-white", 
                                value: numSupportingCharacters,
                                onChange: e => setNumSupportingCharacters(e.target.value),
                                placeholder: "Tùy chọn"
                            } as any)
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Phong cách"),
                        React.createElement("div", { className: "flex flex-wrap gap-2" },
                            cinematicStyles.map(style => (
                                React.createElement("button", {
                                    key: style,
                                    type: "button",
                                    onClick: () => setSelectedCinematicStyle(style),
                                    className: `px-3 py-1 rounded text-sm border transition ${selectedCinematicStyle === style ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`
                                }, style)
                            ))
                        )
                    ),
                    React.createElement("button", {
                        type: "submit",
                        disabled: loading,
                        className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
                    }, loading ? "Đang tạo..." : "Tạo Kịch Bản")
                )
            )
        ),
        // Right Panel
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
                        React.createElement("h3", { className: "text-xl font-bold text-yellow-400 mb-4" } as any, "Danh sách Nhân vật"),
                        React.createElement("div", { className: "space-y-4" } as any,
                            generatedContent.characterList.map((char, idx) => (
                                React.createElement(CharacterCard, {
                                    key: idx,
                                    character: char,
                                    characterIndex: idx,
                                    onGenerateImage: handleGenerateCharacterImage,
                                    imageData: characterImages[idx] || {},
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

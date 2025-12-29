import React, { useState, useCallback } from 'react';

// --- TYPES ---
interface Character {
  name: string;
  role: string;
  description: string;
  whiskPrompt: string;
}

interface Background {
  name: string;
  description: string;
  whiskPrompt: string;
}

interface GeneratedContent {
  characterList: Character[];
  backgroundList: Background[];
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
  
    return (
      React.createElement("div",
        { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm", onClick: onClose },
        React.createElement("div",
          { className: "relative w-full max-w-4xl max-h-[90vh] p-4", onClick: (e) => e.stopPropagation() },
          React.createElement("img", { src: imageUrl, alt: "Large view", className: "w-full h-full object-contain rounded-lg shadow-2xl" }),
          React.createElement("div", { className: "absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4" },
              React.createElement("button", { onClick: handleSave, className: "px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg" }, "Lưu ảnh"),
              React.createElement("button", { onClick: onClose, className: "px-6 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg" }, "Đóng")
          )
        )
      )
    );
};

const CharacterCard = ({ character, characterIndex, onGenerateImage, imageData, onImageClick }: {
    character: Character;
    characterIndex: number;
    onGenerateImage: (index: string, prompt: string, ratio: '16:9' | '9:16') => void;
    imageData: { imageUrl?: string; isGenerating?: boolean; error?: string; };
    onImageClick: (url: string) => void;
}): React.ReactElement => {
  const [copied, setCopied] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16'); // Characters default to Portrait

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const { imageUrl, isGenerating, error } = imageData;
  const imageContainerAspectRatio = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';

  return (
    React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-lg border border-gray-700" },
       React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3" },
         React.createElement("div", { className: "flex items-center gap-3" },
           React.createElement("h4", { className: "text-lg font-bold text-gray-100" }, character.name),
           React.createElement("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${character.role === 'Nhân vật chính' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-600/50 text-gray-300'}` }, character.role)
         ),
         React.createElement("div", { className: "flex items-center gap-2 flex-shrink-0" },
            React.createElement("button", { onClick: () => setAspectRatio('16:9'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '16:9' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Ngang"),
            React.createElement("button", { onClick: () => setAspectRatio('9:16'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '9:16' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Dọc"),
            React.createElement("button", { onClick: () => onGenerateImage(`char-${characterIndex}`, character.whiskPrompt, aspectRatio), disabled: isGenerating, className: "bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-4 rounded-md disabled:opacity-50 transition" }, isGenerating ? "Đang tạo..." : "Tạo ảnh")
         )
       ),
       React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
         React.createElement("div", null,
           React.createElement("p", { className: "text-gray-300 text-sm mb-4" }, character.description),
           React.createElement("div", null,
             React.createElement("p", { className: "font-semibold text-sm text-indigo-300 mb-2" }, "Prompt tạo ảnh nhân vật (Whisk AI):"),
             React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
               React.createElement("p", { className: "text-gray-200 text-xs break-words pr-24" }, character.whiskPrompt),
               React.createElement("button", { onClick: () => copyToClipboard(character.whiskPrompt), className: `absolute top-2 right-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors duration-200 ${copied ? 'bg-green-600' : ''}` }, copied ? 'Đã sao chép' : 'Sao chép')
             )
           )
         ),
         React.createElement("div", { className: `w-full ${imageContainerAspectRatio} bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700` },
            isGenerating && React.createElement("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-green-400" }),
            error && React.createElement("p", { className: "text-red-400 text-xs text-center p-2" }, error),
            imageUrl && !isGenerating && !error && (
                React.createElement("img", { src: imageUrl, alt: character.name, className: "w-full h-full object-cover rounded-md cursor-pointer", onClick: () => onImageClick(imageUrl) })
            ),
            !isGenerating && !error && !imageUrl && React.createElement("p", { className: "text-gray-500 text-xs" }, "Ảnh sẽ hiện ở đây")
         )
       )
    )
  );
};

const BackgroundCard = ({ background, backgroundIndex, onGenerateImage, imageData, onImageClick }: {
  background: Background;
  backgroundIndex: number;
  onGenerateImage: (index: string, prompt: string, ratio: '16:9' | '9:16') => void;
  imageData: { imageUrl?: string; isGenerating?: boolean; error?: string; };
  onImageClick: (url: string) => void;
}): React.ReactElement => {
const [copied, setCopied] = useState(false);
const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9'); // Backgrounds default to Landscape

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
};

const { imageUrl, isGenerating, error } = imageData;
const imageContainerAspectRatio = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';

return (
  React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-lg border border-gray-700" },
     React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3" },
       React.createElement("h4", { className: "text-lg font-bold text-gray-100" }, background.name),
       React.createElement("div", { className: "flex items-center gap-2 flex-shrink-0" },
          React.createElement("button", { onClick: () => setAspectRatio('16:9'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '16:9' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Ngang"),
          React.createElement("button", { onClick: () => setAspectRatio('9:16'), className: `px-3 py-1.5 text-xs rounded-md font-semibold transition ${aspectRatio === '9:16' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}` }, "Dọc"),
          React.createElement("button", { onClick: () => onGenerateImage(`bg-${backgroundIndex}`, background.whiskPrompt, aspectRatio), disabled: isGenerating, className: "bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-4 rounded-md disabled:opacity-50 transition" }, isGenerating ? "Đang tạo..." : "Tạo bối cảnh")
       )
     ),
     React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
       React.createElement("div", null,
         React.createElement("p", { className: "text-gray-300 text-sm mb-4" }, background.description),
         React.createElement("div", null,
           React.createElement("p", { className: "font-semibold text-sm text-indigo-300 mb-2" }, "Prompt tạo bối cảnh (Whisk AI):"),
           React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
             React.createElement("p", { className: "text-gray-200 text-xs break-words pr-24" }, background.whiskPrompt),
             React.createElement("button", { onClick: () => copyToClipboard(background.whiskPrompt), className: `absolute top-2 right-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors duration-200 ${copied ? 'bg-green-600' : ''}` }, copied ? 'Đã sao chép' : 'Sao chép')
           )
         )
       ),
       React.createElement("div", { className: `w-full ${imageContainerAspectRatio} bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700` },
          isGenerating && React.createElement("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-green-400" }),
          error && React.createElement("p", { className: "text-red-400 text-xs text-center p-2" }, error),
          imageUrl && !isGenerating && !error && (
              React.createElement("img", { src: imageUrl, alt: background.name, className: "w-full h-full object-cover rounded-md cursor-pointer", onClick: () => onImageClick(imageUrl) })
          ),
          !isGenerating && !error && !imageUrl && React.createElement("p", { className: "text-gray-500 text-xs" }, "Ảnh bối cảnh sẽ hiện ở đây")
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
    });
  };

  return (
    React.createElement("div", { className: "relative bg-gray-700 p-4 rounded-md border border-gray-600 mb-4 group" },
      React.createElement("div", { className: "absolute -left-2 -top-2 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg" }, promptNumber),
      React.createElement("p", { className: "text-gray-200 text-sm break-words pr-24" }, prompt),
      React.createElement("button", { onClick: () => copyToClipboard(prompt), className: `absolute top-2 right-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 ${copied ? 'bg-green-600' : ''}` }, copied ? 'Đã sao chép' : 'Sao chép')
    )
  );
};

const cinematicStyles = ["Hiện đại", "Điện ảnh", "Viễn tưởng", "Tiền sử", "Hoạt hình", "Hài hước"];

// --- MAIN APP ---
const VietKichBanApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }): React.ReactElement => {
  const [videoIdea, setVideoIdea] = useState('');
  const [duration, setDuration] = useState('');
  const [numMainCharacters, setNumMainCharacters] = useState('');
  const [numSupportingCharacters, setNumSupportingCharacters] = useState('');
  const [selectedCinematicStyle, setSelectedCinematicStyle] = useState('Hiện đại');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<{ [key: string]: { imageUrl?: string; isGenerating?: boolean; error?: string; } }>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
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
    const realismEnforcement = cinematicStyle !== "Viễn tưởng" 
        ? "ABSOLUTE RULE: This script must be 100% GROUNDED IN CURRENT REALITY. No magic, no sci-fi gadgets, no teleportation, no unrealistic physics. Everything must be physically possible in the modern world (or the era described if historic like 'Prehistoric')." 
        : "Style is Sci-Fi, futuristic elements allowed.";

    const voicePromptInstruction = hasVoice 
        ? `Dialogue Mode: ON. Language: ${voiceLanguage}. End prompts with " Audio: [Character Name]: '[Dialogue]'."`
        : `Dialogue Mode: OFF. No spoken words. Visual prompts only.`;

    const commonPrompt = `
You are an expert Hollywood Screenwriter and Prompt Engineer. Create a cohesive 4-task script plan in JSON.
**CREATIVITY:** Generate unique stories and names every time. Avoid clichés.

**STRICT REALISM RULES:**
${realismEnforcement}

**TASK 1: CHARACTERS (Whisk Prompts)**
- Create a list of characters.
- Whisk Prompt Rules:
  1. ONLY describe physical appearance, clothing, and FACIAL EMOTION.
  2. NO items, NO weapons, NO backgrounds, NO accessories (except simple glasses/hats if part of core identity).
  3. POSTURE: Must stand straight, facing directly at the camera.
  4. BACKGROUND: Must be a 'solid flat white background'.
  5. LANGUAGE: English.

**TASK 2: BACKGROUNDS (Location List)**
- Identify unique recurring locations in the script. 
- For each, provide a name and a cinematic Whisk prompt for a standalone background image (empty landscape/interior).

**TASK 3: SCRIPT PROMPTS (VEO 3.1)**
- Total Scenes: ${numberOfScenes}.
- EACH PROMPT MUST DESCRIBE:
  1. CHARACTER CLOTHING (Consistent with Task 1).
  2. CHARACTER EMOTION.
  3. SPECIFIC ITEMS/OBJECTS being used.
  4. DETAILED SETTING (Environment, lighting, textures).
- LANGUAGE: English.
- ${voicePromptInstruction}

JSON Output Format:
{
  "characterList": [{ "name": "...", "role": "Nhân vật chính/phụ", "description": "...", "whiskPrompt": "..." }],
  "backgroundList": [{ "name": "...", "description": "...", "whiskPrompt": "..." }],
  "prompts": ["..."]
}`;

    const systemPrompt = `${commonPrompt}\n\nSTRICT JSON ONLY. NO MARKDOWN.`;
    const userPrompt = `Idea: "${videoIdea}"\nStyle: ${cinematicStyle}\nMain: ${numMain}\nSup: ${numSupporting}`;

    let result: GeneratedContent | null = null;
    let finalError: any = null;

    if ((selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
        try {
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: `${systemPrompt}\n\n${userPrompt}`,
                config: { responseMimeType: "application/json" },
            });
            result = JSON.parse(cleanJsonString(response.text)) as GeneratedContent;
        } catch (e) { finalError = e; }
    }

    if (!result && (selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], response_format: { type: 'json_object' } })
            });
            const data = await res.json();
            result = JSON.parse(data.choices[0].message.content) as GeneratedContent;
        } catch (e) { finalError = e; }
    }

    if (result) return result;
    throw finalError || new Error("Failed to generate script.");
  }, [geminiApiKey, openaiApiKey, selectedAIModel]);

  const handleGenerateImage = async (id: string, prompt: string, ratio: '16:9' | '9:16') => {
    if (!geminiApiKey && !openaiApiKey) return;
    setImages(prev => ({ ...prev, [id]: { isGenerating: true } }));
    try {
        let url = '';
        if (geminiApiKey) {
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            const resp = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: ratio }
            });
            if (resp.generatedImages?.[0]?.image?.imageBytes) url = `data:image/png;base64,${resp.generatedImages[0].image.imageBytes}`;
        }
        if (!url && openaiApiKey) {
            const res = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: ratio === '16:9' ? '1792x1024' : '1024x1792', response_format: 'b64_json' })
            });
            const data = await res.json();
            if (data.data?.[0]?.b64_json) url = `data:image/png;base64,${data.data[0].b64_json}`;
        }
        setImages(prev => ({ ...prev, [id]: { isGenerating: false, imageUrl: url } }));
    } catch (e: any) { setImages(prev => ({ ...prev, [id]: { isGenerating: false, error: e.message } })); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setGeneratedContent(null); setImages({});
    try {
      const durationNum = parseFloat(duration) || 1;
      const res = await generateScript(videoIdea, durationNum, selectedCinematicStyle, parseInt(numMainCharacters) || null, parseInt(numSupportingCharacters) || null, hasVoice, voiceLanguage);
      setGeneratedContent(res);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleDownload = () => {
    if(!generatedContent) return;
    const text = `--- KỊCH BẢN --- \n\n${generatedContent.prompts.map((p, i) => `Scene ${i+1}: ${p}`).join('\n\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kich_ban_aicreators.txt'; a.click();
  };

  return (
    React.createElement("div", { className: "w-full h-full p-4" },
      lightboxImage && React.createElement(Lightbox, { imageUrl: lightboxImage, onClose: () => setLightboxImage(null) }),
      React.createElement("div", { className: "flex flex-col lg:flex-row gap-8" },
        React.createElement("div", { className: "lg:w-1/3" },
          React.createElement("form", { onSubmit: handleSubmit, className: "bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4" },
            React.createElement("div", { className: "flex flex-wrap gap-2" },
                React.createElement("button", { type: "button", onClick: () => setHasVoice(!hasVoice), className: `px-4 py-1 rounded text-xs font-bold transition ${hasVoice ? 'bg-green-600' : 'bg-gray-600'}` }, hasVoice ? "Có thoại" : "Không thoại"),
                hasVoice && React.createElement("button", { type: "button", onClick: () => setVoiceLanguage(voiceLanguage === 'Vietnamese' ? 'English' : 'Vietnamese'), className: "px-4 py-1 rounded text-xs bg-blue-600 font-bold" }, voiceLanguage)
            ),
            React.createElement("textarea", { className: "w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm h-24", value: videoIdea, onChange: e => setVideoIdea(e.target.value), required: true, placeholder: "Ý tưởng phim..." } as any),
            React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                React.createElement("input", { type: "number", step: "0.1", className: "bg-gray-900 border border-gray-600 rounded p-2 text-sm", value: duration, onChange: e => setDuration(e.target.value), placeholder: "Phút (VD: 1.5)" } as any),
                React.createElement("select", { className: "bg-gray-900 border border-gray-600 rounded p-2 text-sm", value: selectedCinematicStyle, onChange: e => setSelectedCinematicStyle(e.target.value) }, cinematicStyles.map(s => React.createElement("option", { key: s, value: s }, s)))
            ),
            React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                React.createElement("input", { type: "number", className: "bg-gray-900 border border-gray-600 rounded p-2 text-sm", value: numMainCharacters, onChange: e => setNumMainCharacters(e.target.value), placeholder: "Số NV chính" } as any),
                React.createElement("input", { type: "number", className: "bg-gray-900 border border-gray-600 rounded p-2 text-sm", value: numSupportingCharacters, onChange: e => setNumSupportingCharacters(e.target.value), placeholder: "Số NV phụ" } as any)
            ),
            React.createElement("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 py-3 rounded font-bold uppercase tracking-widest disabled:opacity-50" }, loading ? "Đang xử lý..." : "Tạo Kịch Bản")
          )
        ),
        React.createElement("div", { className: "lg:w-2/3 h-[80vh] overflow-y-auto custom-scrollbar pr-2" },
            loading && React.createElement(Loader),
            error && React.createElement("div", { className: "bg-red-900/50 p-4 rounded text-red-200 border border-red-500" }, error),
            generatedContent && React.createElement("div", { className: "space-y-8" },
                React.createElement("div", { className: "flex gap-3" },
                    React.createElement("button", { onClick: handleDownload, className: "flex-1 bg-green-600 py-2 rounded font-bold" }, "Tải kịch bản (.txt)"),
                    React.createElement("button", { onClick: () => { navigator.clipboard.writeText(generatedContent.prompts.join('\n\n')); setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000); }, className: "flex-1 bg-purple-600 py-2 rounded font-bold" }, copiedAll ? "Đã chép" : "Chép toàn bộ Prompt")
                ),
                React.createElement("section", null,
                    React.createElement("h3", { className: "text-lg font-bold text-yellow-400 mb-4 uppercase" }, "Dàn Nhân Vật"),
                    React.createElement("div", { className: "space-y-4" }, generatedContent.characterList.map((c, i) => React.createElement(CharacterCard, { key: i, character: c, characterIndex: i, onGenerateImage: handleGenerateImage, imageData: images[`char-${i}`] || {}, onImageClick: setLightboxImage })))
                ),
                React.createElement("section", null,
                    React.createElement("h3", { className: "text-lg font-bold text-green-400 mb-4 uppercase" }, "Bối Cảnh Chính"),
                    React.createElement("div", { className: "space-y-4" }, generatedContent.backgroundList.map((b, i) => React.createElement(BackgroundCard, { key: i, background: b, backgroundIndex: i, onGenerateImage: handleGenerateImage, imageData: images[`bg-${i}`] || {}, onImageClick: setLightboxImage })))
                ),
                React.createElement("section", null,
                    React.createElement("h3", { className: "text-lg font-bold text-cyan-400 mb-4 uppercase" }, "Kịch Bản Video"),
                    generatedContent.prompts.map((p, i) => React.createElement(PromptCard, { key: i, prompt: p, promptNumber: i + 1 }))
                )
            )
        )
      )
    )
  );
};

export default VietKichBanApp;

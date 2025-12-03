

import React, { useState, useCallback } from 'react';

// --- TYPES ---
interface RecurringContext {
  name: string; // e.g., "Bối cảnh A"
  description: string; // Vietnamese description
  whiskPrompt: string; // English prompt
}

interface Scene {
  character: string;
  style: string;
  scene: string; // Vietnamese description
  characterSummary: string;
  contextName: string; // e.g., "Bối cảnh A"
  whisk_prompt_vi: string; // English prompt
  whisk_prompt_no_outfit: string; // English prompt
  motion_prompt: string; // English prompt
}

interface ScriptResponse {
    recurringContexts: RecurringContext[];
    scenes: Scene[];
}


// --- COMPONENTS ---
const Loader = (): React.ReactElement => {
  return (
    React.createElement("div", { className: "flex items-center justify-center p-4" },
      React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }),
      React.createElement("p", { className: "ml-3 text-gray-300" }, "Đang tạo kịch bản...")
    )
  );
};

const ContextCard = ({ context }: { context: RecurringContext }): React.ReactElement => {
    const [copied, setCopied] = useState(false);
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        React.createElement("div", { className: "bg-gray-700/50 p-4 rounded-lg border border-gray-600" },
            React.createElement("h4", { className: "font-bold text-lg text-yellow-400" }, context.name),
            React.createElement("p", { className: "text-sm text-gray-400 italic mb-2" }, context.description),
            React.createElement("div", { className: "relative bg-gray-900 p-3 rounded-md border border-gray-700" },
                React.createElement("p", { className: "text-yellow-300 text-xs break-words pr-20 font-mono" }, context.whiskPrompt),
                React.createElement("button", {
                    onClick: () => copyToClipboard(context.whiskPrompt),
                    className: `absolute top-2 right-2 px-3 py-1 text-white text-xs rounded-lg transition-colors duration-200 focus:outline-none ${copied ? 'bg-green-600' : 'bg-yellow-600 hover:bg-yellow-700'}`
                }, copied ? 'Đã sao chép!' : 'Sao chép')
            )
        )
    );
};


const SceneCard = ({ scene, sceneNumber }: { scene: Scene; sceneNumber: number }): React.ReactElement => {
  const [copiedWhisk, setCopiedWhisk] = useState(false);
  const [copiedWhiskNoOutfit, setCopiedWhiskNoOutfit] = useState(false);
  const [copiedFlow, setCopiedFlow] = useState(false);

  const copyToClipboard = (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const summaryText = `${scene.characterSummary}${scene.contextName ? ` - ${scene.contextName}` : ''}`;

  return (
    React.createElement("div", { className: "bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700" },
      React.createElement("h3", { className: "text-xl font-bold text-blue-400 mb-2" }, `Cảnh ${sceneNumber}`),
      summaryText && React.createElement("p", { className: "text-sm text-gray-400 mb-4 italic" },
        summaryText
      ),
      
      // Standard Whisk Prompt
      React.createElement("div", { className: "mt-4" },
        React.createElement("p", { className: "font-bold text-lg text-gray-100 mb-2" }, "Prompt cho Whisk (Đầy đủ)"),
        React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
          React.createElement("p", { className: "text-gray-200 text-sm break-words pr-20 font-mono" }, scene.whisk_prompt_vi),
          React.createElement("button", {
            onClick: () => copyToClipboard(scene.whisk_prompt_vi, setCopiedWhisk),
            className: `absolute top-2 right-2 px-4 py-2 text-white text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${copiedWhisk ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`
          }, copiedWhisk ? 'Đã sao chép!' : 'Sao chép')
        )
      ),

      // Whisk Prompt No Outfit
      React.createElement("div", { className: "mt-4" },
        React.createElement("p", { className: "font-bold text-lg text-yellow-400 mb-2" }, "Prompt cho Whisk (Không trang phục)"),
        React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
          React.createElement("p", { className: "text-gray-200 text-sm break-words pr-20 font-mono" }, scene.whisk_prompt_no_outfit),
          React.createElement("button", {
            onClick: () => copyToClipboard(scene.whisk_prompt_no_outfit, setCopiedWhiskNoOutfit),
            className: `absolute top-2 right-2 px-4 py-2 text-white text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${copiedWhiskNoOutfit ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`
          }, copiedWhiskNoOutfit ? 'Đã sao chép!' : 'Sao chép')
        )
      ),

      // Flow Prompt
      React.createElement("div", { className: "mt-6" },
        React.createElement("p", { className: "font-bold text-lg text-gray-100 mb-2" }, "Prompt cho Flow VEO 3.1 (Chuyển động)"),
        React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
          React.createElement("p", { className: "text-gray-200 text-sm break-words pr-20 font-mono" }, scene.motion_prompt),
          React.createElement("button", {
            onClick: () => copyToClipboard(scene.motion_prompt, setCopiedFlow),
            className: `absolute top-2 right-2 px-4 py-2 text-white text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${copiedFlow ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`
          }, copiedFlow ? 'Đã sao chép!' : 'Sao chép')
        )
      )
    )
  );
};

const cinematicStyles = [
  "Hiện đại", "Điện ảnh", "Viễn tưởng", "Tiền sử", "Hoạt hình", "Hài hước"
];

// --- APP COMPONENT ---
const MyChannelApp = ({ geminiApiKey, openaiApiKey, openRouterApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, openRouterApiKey: string, selectedAIModel: string }): React.ReactElement => {
  const [videoIdea, setVideoIdea] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('minutes');
  const [selectedCinematicStyle, setSelectedCinematicStyle] = useState('Hiện đại');
  const [generatedContent, setGeneratedContent] = useState<ScriptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States for "Copy All" buttons
  const [copiedAllWhisk, setCopiedAllWhisk] = useState(false);
  const [copiedAllWhiskNoOutfit, setCopiedAllWhiskNoOutfit] = useState(false);
  const [copiedAllFlow, setCopiedAllFlow] = useState(false);

  const generateScript = useCallback(async (
    videoIdea: string,
    numberOfScenes: number,
    cinematicStyle: string
  ): Promise<ScriptResponse> => {
    
    const systemPrompt = `You are an expert Hollywood screenwriter and prompt engineer for Whisk AI and VEO 3.1. Your primary goal is to ensure thematic and visual consistency.

**CREATIVITY MANDATE:** For every new request, even if the user provides the exact same idea, you MUST generate a completely new story, unique characters, and a fresh sequence of prompts.

**CRITICAL RULE: THEMATIC CONSISTENCY**
You MUST strictly adhere to the user-selected "Cinematic Style": "${cinematicStyle}". All elements (characters, actions, settings, objects) MUST be appropriate for that style.

**CRITICAL MANDATE: EXACT SCENE COUNT & DURATION**
The user requires **EXACTLY ${numberOfScenes} SCENES**. You MUST generate exactly ${numberOfScenes} scene objects. If the story ends early, you MUST extend it with atmospheric shots, detailed character reactions, or environmental pans to meet the count. This is a non-negotiable rule.

**TASK 1: CONTEXT ANALYSIS & BACKGROUND PROMPT GENERATION (INTERNAL PRE-PROCESSING)**
Before generating scenes, analyze the entire script to identify recurring locations.
1. For each location that appears 2 or more times, create a "recurring context" object.
2. **name**: Assign a unique name like 'Bối cảnh A', 'Bối cảnh B'.
3. **description**: A brief VIETNAMESE description of the location.
4. **whiskPrompt**: A detailed, cinematic prompt in ENGLISH for Whisk AI to generate a standalone background image. This prompt must be photorealistic (unless style is animated) and highly detailed.

**TASK 2: SCENE GENERATION**
Generate an array of exactly ${numberOfScenes} scene objects.

**CRITICAL RULES FOR JSON OUTPUT:**
1.  **LANGUAGE**: All prompts ('whisk_prompt_vi', 'whisk_prompt_no_outfit', 'motion_prompt') MUST be in ENGLISH. The general 'scene' description and 'recurringContexts.description' MUST be in VIETNAMESE.
2.  **CONTEXT NAME ('contextName')**: In each scene object, if it takes place in a recurring location from Task 1, you MUST populate the 'contextName' field with its exact name (e.g., 'Bối cảnh A'). Otherwise, provide an empty string.
3.  **CHARACTER SUMMARY ('characterSummary')**: This field MUST be a CONCISE summary in VIETNAMESE. It MUST follow the exact format: '[Role]: [Quantity] [Gender]'. Example: 'Nhân vật chính: 1 Nam, 1 Nữ' or 'Nhân vật phụ: 1 Nữ'. DO NOT add any other descriptions or text.
4.  **PROMPT CONTENT (ABSOLUTE RULE)**: DO NOT mention any character names (e.g., 'John') or context names (e.g., 'Bối cảnh A') inside any of the generated prompts. Describe the characters and scenes visually without using these specific identifiers.
5.  **WHISK PROMPT ('whisk_prompt_vi')**: ENGLISH prompt. Must describe the character's GENDER/IDENTITY, DETAILED ACTION, GESTURES, DETAILED EMOTIONS/FACIAL EXPRESSIONS, and outfit. The background description must be word-for-word identical if it's a recurring location.
6.  **WHISK NO OUTFIT PROMPT ('whisk_prompt_no_outfit')**: ENGLISH prompt. Exactly like 'whisk_prompt_vi' but STRICTLY EXCLUDE all descriptions of clothing/outfits.
7.  **FLOW PROMPT ('motion_prompt')**: ENGLISH prompt. Must be HIGHLY DETAILED, describing dynamic lighting (e.g., 'golden hour light streaming through'), color palette ('moody blues and cool greys'), environment details ('rain-slicked pavement reflecting neon signs'), specific camera movement ('a slow dolly zoom'), and the character's precise actions and emotions ('a single tear rolls down her cheek, her expression a mix of sorrow and relief').
`;
    
    let finalError: unknown;

    // 1. Try Gemini
    if ((selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
        try {
            if (!geminiApiKey && selectedAIModel === 'gemini') throw new Error("API Key Gemini chưa được cấu hình.");
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
    
            const schema = {
                type: window.GenAIType.OBJECT,
                properties: {
                    recurringContexts: {
                        type: window.GenAIType.ARRAY,
                        items: {
                            type: window.GenAIType.OBJECT,
                            properties: {
                                name: { type: window.GenAIType.STRING },
                                description: { type: window.GenAIType.STRING },
                                whiskPrompt: { type: window.GenAIType.STRING },
                            },
                            required: ["name", "description", "whiskPrompt"]
                        }
                    },
                    scenes: {
                        type: window.GenAIType.ARRAY,
                        items: {
                            type: window.GenAIType.OBJECT,
                            properties: {
                                character: { type: window.GenAIType.STRING },
                                style: { type: window.GenAIType.STRING },
                                scene: { type: window.GenAIType.STRING },
                                characterSummary: { 
                                    type: window.GenAIType.STRING,
                                    description: "CONCISE VIETNAMESE summary. Format: '[Role]: [Quantity] [Gender]'. Example: 'Nhân vật chính: 1 Nam'. NO other text."
                                },
                                contextName: { type: window.GenAIType.STRING },
                                whisk_prompt_vi: { type: window.GenAIType.STRING },
                                whisk_prompt_no_outfit: { type: window.GenAIType.STRING },
                                motion_prompt: { type: window.GenAIType.STRING },
                            },
                            required: ["character", "style", "scene", "characterSummary", "contextName", "whisk_prompt_vi", "whisk_prompt_no_outfit", "motion_prompt"]
                        }
                    }
                },
                required: ["recurringContexts", "scenes"]
            };
    
            const prompt = `${systemPrompt}
              Video Idea: "${videoIdea}"
              This video will be divided into ${numberOfScenes} scenes.
              The overall cinematic style is: ${cinematicStyle}.
              Generate a JSON object with keys "recurringContexts" and "scenes" (containing exactly ${numberOfScenes} objects).
            `;
      
            const response = await ai.models.generateContent({
              model: "gemini-3-pro-preview",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: schema,
              },
            });
      
            const jsonStr = response.text.trim();
            return JSON.parse(jsonStr) as ScriptResponse;
        } catch (e) {
            console.warn("Gemini failed", e);
            if (selectedAIModel === 'gemini') throw e;
            finalError = e;
        }
    }

    // Fallback logic for OpenAI/OpenRouter (simplified prompt, as they don't use schema in the same way)
    const fallbackSystemPrompt = `${systemPrompt}
        You must return a single JSON object with two keys: "recurringContexts" (an array of context objects) and "scenes" (an array of exactly ${numberOfScenes} scene objects).
    `;
    const fallbackUserPrompt = `Video Idea: "${videoIdea}". Total scenes: ${numberOfScenes}. Style: ${cinematicStyle}.`;

    // 2. Try OpenAI
    if ((selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
        try {
            if (!openaiApiKey && selectedAIModel === 'openai') throw new Error("API Key OpenAI chưa được cấu hình.");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [ { role: 'system', content: fallbackSystemPrompt }, { role: 'user', content: fallbackUserPrompt } ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error( (await response.json()).error?.message || 'OpenAI API failed');
            const data = await response.json();
            const parsedResponse = JSON.parse(data.choices[0].message.content);
            if (parsedResponse.scenes) return parsedResponse;

        } catch (e) {
            console.warn("OpenAI failed", e);
            if (selectedAIModel === 'openai') throw e;
            finalError = e;
        }
    }

    // 3. Try OpenRouter
    if ((selectedAIModel === 'openrouter' || selectedAIModel === 'auto') && openRouterApiKey) {
        try {
            if (!openRouterApiKey && selectedAIModel === 'openrouter') throw new Error("API Key OpenRouter chưa được cấu hình.");
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openRouterApiKey}` },
                body: JSON.stringify({
                    model: 'google/gemini-2.5-pro',
                    messages: [ { role: 'system', content: fallbackSystemPrompt }, { role: 'user', content: fallbackUserPrompt } ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenRouter API failed');
            const data = await response.json();
            const parsedResponse = JSON.parse(data.choices[0].message.content);
            if (parsedResponse.scenes) return parsedResponse;
        } catch (e) {
            console.warn("OpenRouter failed", e);
            if (selectedAIModel === 'openrouter') throw e;
            finalError = e;
        }
    }

    throw finalError || new Error("Không thể tạo kịch bản. Vui lòng kiểm tra API Key.");
  }, [geminiApiKey, openaiApiKey, openRouterApiKey, selectedAIModel]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedContent(null);
    setCopiedAllWhisk(false);
    setCopiedAllWhiskNoOutfit(false);
    setCopiedAllFlow(false);

    let actualDurationInSeconds = 0;
    const durationNum = parseFloat(totalDuration);

    if (isNaN(durationNum) || durationNum <= 0) {
      setError("Thời lượng video phải là một số dương.");
      setLoading(false);
      return;
    }

    if (durationUnit === 'minutes') {
      actualDurationInSeconds = durationNum * 60;
    } else {
      actualDurationInSeconds = durationNum;
    }

    const sceneDuration = 8;
    const numberOfScenes = Math.ceil(actualDurationInSeconds / sceneDuration);

    if (numberOfScenes === 0) {
      setError("Thời lượng quá ngắn để tạo cảnh.");
      setLoading(false);
      return;
    }

    try {
      const content = await generateScript(videoIdea, numberOfScenes, selectedCinematicStyle);
      setGeneratedContent(content);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo kịch bản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [videoIdea, totalDuration, durationUnit, selectedCinematicStyle, generateScript]);

  const handleDownloadPrompts = (prompts: string[], filename: string) => {
    const content = prompts.join('\n\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWhiskPrompts = () => {
    if(!generatedContent?.scenes) return;
    const whiskPrompts = generatedContent.scenes.map(scene => scene.whisk_prompt_vi);
    handleDownloadPrompts(whiskPrompts, 'whisk_prompts.txt');
  };

  const handleDownloadWhiskNoOutfitPrompts = () => {
    if(!generatedContent?.scenes) return;
    const whiskPrompts = generatedContent.scenes.map(scene => scene.whisk_prompt_no_outfit);
    handleDownloadPrompts(whiskPrompts, 'whisk_prompts_no_outfit.txt');
  };

  const handleDownloadFlowPrompts = () => {
    if(!generatedContent?.scenes) return;
    const flowPrompts = generatedContent.scenes.map(scene => scene.motion_prompt);
    handleDownloadPrompts(flowPrompts, 'flow_veo_prompts.txt');
  };

  const handleCopyAllWhisk = () => {
    if (!generatedContent?.scenes) return;
    const allWhiskPrompts = generatedContent.scenes.map(scene => scene.whisk_prompt_vi).join('\n\n\n');
    navigator.clipboard.writeText(allWhiskPrompts).then(() => {
        setCopiedAllWhisk(true);
        setTimeout(() => setCopiedAllWhisk(false), 2000);
    });
  };

  const handleCopyAllWhiskNoOutfit = () => {
    if (!generatedContent?.scenes) return;
    const allWhiskPrompts = generatedContent.scenes.map(scene => scene.whisk_prompt_no_outfit).join('\n\n\n');
    navigator.clipboard.writeText(allWhiskPrompts).then(() => {
        setCopiedAllWhiskNoOutfit(true);
        setTimeout(() => setCopiedAllWhiskNoOutfit(false), 2000);
    });
  };

  const handleCopyAllFlow = () => {
      if (!generatedContent?.scenes) return;
      const allFlowPrompts = generatedContent.scenes.map(scene => scene.motion_prompt).join('\n\n\n');
      navigator.clipboard.writeText(allFlowPrompts).then(() => {
          setCopiedAllFlow(true);
          setTimeout(() => setCopiedAllFlow(false), 2000);
      });
  };

  return (
    React.createElement("div", { className: "w-full h-full p-4" },
        React.createElement("div", { className: "flex flex-col md:flex-row md:gap-8 lg:gap-12" },
          // Left Column
          React.createElement("div", { className: "md:w-2/5 lg:w-1/3 mb-8 md:mb-0" },
            React.createElement("form", { onSubmit: handleSubmit, className: "bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 sticky top-8" },
              React.createElement("div", { className: "mb-6" },
                React.createElement("label", { htmlFor: "videoIdea", className: "block text-gray-200 text-sm font-bold mb-2" }, "Ý tưởng video:"),
                React.createElement("textarea", {
                  id: "videoIdea",
                  className: "shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-y",
                  placeholder: "Ví dụ: Một hành trình khám phá về công nghệ tương lai trên sao Hỏa...",
                  value: videoIdea,
                  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setVideoIdea(e.target.value),
                  required: true
                })
              ),
              React.createElement("div", { className: "mb-6" },
                React.createElement("label", { htmlFor: "totalDuration", className: "block text-gray-200 text-sm font-bold mb-2" }, "Tổng thời lượng video:"),
                React.createElement("div", { className: "flex" },
                  React.createElement("input", {
                    type: "number", id: "totalDuration",
                    className: "shadow appearance-none border border-gray-600 rounded-l w-full py-3 px-4 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    placeholder: "Ví dụ: 15", min: "1", step: "any", value: totalDuration,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTotalDuration(e.target.value),
                    required: true
                  }),
                  React.createElement("div", { className: "flex" },
                      React.createElement("button", { type: "button", onClick: () => setDurationUnit('minutes'), className: `shadow border-y border-l border-gray-600 py-3 px-4 ${durationUnit === 'minutes' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'} focus:outline-none`}, "Phút"),
                      React.createElement("button", { type: "button", onClick: () => setDurationUnit('seconds'), className: `shadow border border-gray-600 rounded-r py-3 px-4 ${durationUnit === 'seconds' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'} focus:outline-none`}, "Giây")
                  )
                )
              ),
              React.createElement("div", { className: "mb-6" },
                React.createElement("label", { className: "block text-gray-200 text-sm font-bold mb-2" }, "Phong cách điện ảnh:"),
                React.createElement("div", { className: "flex flex-wrap gap-2" },
                  cinematicStyles.map((style) => React.createElement("button", {
                    key: style, type: "button",
                    onClick: () => setSelectedCinematicStyle(style),
                    className: `px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${selectedCinematicStyle === style ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`
                  }, style))
                )
              ),
              React.createElement("button", {
                type: "submit",
                className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                disabled: loading
              }, loading ? 'Đang tạo...' : 'Tạo Kịch Bản')
            )
          ),
          // Right Column
          React.createElement("div", { className: "md:w-3/5 lg:w-2/3" },
            loading && React.createElement(Loader, null),
            error && React.createElement("div", { className: "bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-8", role: "alert" },
              React.createElement("strong", { className: "font-bold" }, "Lỗi!"),
              React.createElement("span", { className: "block sm:inline ml-2" }, error)
            ),
            generatedContent && (
              React.createElement("div", null,
                React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8" },
                    React.createElement("div", { className: "bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex flex-col gap-3" },
                        React.createElement("h4", { className: "text-center font-bold text-gray-200" }, "Whisk (Đầy đủ)"),
                        React.createElement("button", { onClick: handleCopyAllWhisk, className: `w-full font-semibold py-2 rounded text-sm ${copiedAllWhisk ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-200'}`}, copiedAllWhisk ? "Đã sao chép" : "Sao chép toàn bộ"),
                        React.createElement("button", { onClick: handleDownloadWhiskPrompts, className: "w-full bg-slate-600 text-gray-200 font-semibold py-2 rounded text-sm"}, "Tải xuống (.txt)")
                    ),
                    React.createElement("div", { className: "bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex flex-col gap-3" },
                        React.createElement("h4", { className: "text-center font-bold text-yellow-400" }, "Whisk (Không trang phục)"),
                        React.createElement("button", { onClick: handleCopyAllWhiskNoOutfit, className: `w-full font-semibold py-2 rounded text-sm ${copiedAllWhiskNoOutfit ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-200'}`}, copiedAllWhiskNoOutfit ? "Đã sao chép" : "Sao chép toàn bộ"),
                        React.createElement("button", { onClick: handleDownloadWhiskNoOutfitPrompts, className: "w-full bg-slate-600 text-gray-200 font-semibold py-2 rounded text-sm"}, "Tải xuống (.txt)")
                    ),
                    React.createElement("div", { className: "bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex flex-col gap-3" },
                        React.createElement("h4", { className: "text-center font-bold text-indigo-400" }, "Flow VEO 3.1"),
                        React.createElement("button", { onClick: handleCopyAllFlow, className: `w-full font-semibold py-2 rounded text-sm ${copiedAllFlow ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-200'}`}, copiedAllFlow ? "Đã sao chép" : "Sao chép toàn bộ"),
                        React.createElement("button", { onClick: handleDownloadFlowPrompts, className: "w-full bg-slate-600 text-gray-200 font-semibold py-2 rounded text-sm"}, "Tải xuống (.txt)")
                    )
                ),
                
                generatedContent.recurringContexts.length > 0 && React.createElement("div", { className: "mb-8" },
                    React.createElement("h3", { className: "text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500/30 pb-2" }, "Thống kê Bối cảnh"),
                    React.createElement("div", { className: "space-y-4" },
                        generatedContent.recurringContexts.map(context => React.createElement(ContextCard, { key: context.name, context: context }))
                    )
                ),

                generatedContent.scenes.map((scene, index) => React.createElement(SceneCard, { key: index, scene: scene, sceneNumber: index + 1 }))
              )
            )
          )
        )
    )
  );
};

export default MyChannelApp;

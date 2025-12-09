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
const Loader = ({ text = "Đang tạo kịch bản..." }: { text?: string }): React.ReactElement => {
  return (
    React.createElement("div", { className: "flex items-center justify-center p-4" },
      React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }),
      React.createElement("p", { className: "ml-3 text-gray-300" }, text)
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

  const summaryText = `${scene.characterSummary || ''}${scene.contextName ? ` - ${scene.contextName}` : ''}`;


  return (
    React.createElement("div", { className: "bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700" },
      React.createElement("h3", { className: "text-xl font-bold text-blue-400 mb-2" }, `Cảnh ${sceneNumber}`),
      summaryText.trim() && React.createElement("p", { className: "text-sm text-gray-400 mb-4 italic" },
        summaryText.trim()
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
        React.createElement("p", { className: "font-bold text-lg text-yellow-400 mb-2" }, "Prompt cho Whisk (Không mô tả trang phục)"),
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
const MyChannelApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }): React.ReactElement => {
  const [videoIdea, setVideoIdea] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('minutes');
  const [selectedCinematicStyle, setSelectedCinematicStyle] = useState('Hiện đại');
  
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([]);
  const [recurringContexts, setRecurringContexts] = useState<RecurringContext[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [totalParts, setTotalParts] = useState(0);
  const [currentPart, setCurrentPart] = useState(0);
  const [isGeneratingNextPart, setIsGeneratingNextPart] = useState(false);
  const [scriptHistory, setScriptHistory] = useState<string[]>([]);
  
  const [copiedAllWhisk, setCopiedAllWhisk] = useState(false);
  const [copiedAllWhiskNoOutfit, setCopiedAllWhiskNoOutfit] = useState(false);
  const [copiedAllFlow, setCopiedAllFlow] = useState(false);

  const generateScript = useCallback(async (
    videoIdea: string,
    numberOfScenes: number,
    cinematicStyle: string,
    history: string[],
    currentPartNum: number,
    totalPartNum: number,
    existingContexts: RecurringContext[]
  ): Promise<ScriptResponse> => {
    
    let continuityInstruction = '';
    if (totalPartNum > 1) {
        if (currentPartNum > 1) {
            const conclusionOrNot = currentPartNum < totalPartNum
                ? "This is NOT the final part. Your final scene must be a transitional scene or a cliffhanger to smoothly connect to the next part."
                : "This is the FINAL PART. You must provide a satisfying conclusion to the entire narrative.";
            
            continuityInstruction = `
**STORY CONTINUITY (CRITICAL):**
This is PART ${currentPartNum} of a ${totalPartNum}-part story. ${conclusionOrNot}
You MUST continue the story logically from where the previous part left off.
**Summary of the last scene of the previous part:** "${history[history.length - 1]}"`;
        } else {
            continuityInstruction = `
**STORY START (CRITICAL):**
This is PART 1 of a ${totalPartNum}-part story. The final scene of this part should NOT be a conclusion. It must be a transitional scene or a cliffhanger to set up the next part.`;
        }
    }

    let contextInstruction = '';
    if (currentPartNum > 1 && existingContexts.length > 0) {
        contextInstruction = `
**CONTEXT REUSE (CRITICAL):**
You are provided with a pre-defined list of recurring contexts from Part 1. You MUST use these contexts for any recurring locations in this script part. DO NOT generate a new 'recurringContexts' list. Populate the 'contextName' field in your scenes using the names from this list: ${JSON.stringify(existingContexts)}
        `;
    } else {
        contextInstruction = `
**TASK 1: CONTEXT ANALYSIS (ONE-TIME TASK for Part 1):**
Analyze the entire script idea to identify recurring locations. For each location that appears 2 or more times, create a "recurring context" object.
- **name**: Assign a unique name like 'Bối cảnh A', 'Bối cảnh B'.
- **description**: A brief VIETNAMESE description.
- **whiskPrompt**: A detailed, cinematic prompt in ENGLISH for Whisk AI to generate a standalone background image.
        `;
    }

    const systemPrompt = `You are an expert Hollywood screenwriter and prompt engineer. Your goal is to create a cohesive, visually consistent, and cinematic script.

**CREATIVITY MANDATE:** For every new request, you MUST generate a completely new story, unique characters, and a fresh sequence of prompts.

**CRITICAL RULE: THEMATIC CONSISTENCY**
You MUST strictly adhere to the user-selected "Cinematic Style": "${cinematicStyle}". All elements MUST be appropriate for that style.

${continuityInstruction}

**CRITICAL RULE: EXACT SCENE COUNT**
You MUST generate **EXACTLY ${numberOfScenes} SCENES**. Extend the story with atmospheric shots if needed to meet this count.

${contextInstruction}

**TASK 2: SCENE GENERATION**
Generate an array of exactly ${numberOfScenes} scene objects with the following rules:

**CRITICAL RULES FOR JSON OUTPUT:**
1.  **LANGUAGE**: All prompts ('whisk_prompt_vi', 'whisk_prompt_no_outfit', 'motion_prompt') MUST be in ENGLISH. The 'scene' and 'recurringContexts.description' MUST be in VIETNAMESE.
2.  **CONTEXT NAME ('contextName')**: If a scene uses a recurring location, populate this field with its name (e.g., 'Bối cảnh A'). Otherwise, leave it as an empty string.
3.  **CHARACTER SUMMARY ('characterSummary')**: VIETNAMESE summary. Format: '[Role]: [Quantity] [Gender]'. Example: 'Nhân vật chính: 1 Nam'. NO other text.
4.  **PROMPT CONTENT (ABSOLUTE RULE)**: DO NOT mention character or context names (e.g., 'John', 'Bối cảnh A') inside any of the generated prompts.
5.  **OUTFIT CONSISTENCY ('whisk_prompt_vi')**: The full Whisk prompt must maintain outfit consistency for each character within a single named context. If a character is in 'Bối cảnh A' wearing a blue jacket, they MUST be described with the same blue jacket in all other scenes in 'Bối cảnh A'.
6.  **CINEMATIC STORYTELLING**: For important actions, you MUST break the moment down into multiple, distinct scenes. Use a variety of cinematic shots (close-ups for emotion, medium shots for action, wide shots to establish the scene) to build tension. For example, a character's difficult journey could be three scenes: a wide shot, a medium shot of their face, and a close-up of their boots. This is mandatory.
7.  **WHISK PROMPTS ('whisk_prompt_vi', 'whisk_prompt_no_outfit')**: ENGLISH prompts describing gender, detailed actions, gestures, and emotions. The 'no_outfit' version must strictly exclude all clothing descriptions.
8.  **FLOW PROMPT ('motion_prompt')**: HIGHLY DETAILED ENGLISH prompt describing dynamic lighting, color palette, environment details, specific camera movement, and character's precise actions/emotions.
`;
    
    let finalError: unknown;
    let script: ScriptResponse | null = null;
    const prompt = `${systemPrompt}\nVideo Idea: "${videoIdea}"\nGenerate JSON with "recurringContexts" and "scenes" (exactly ${numberOfScenes} objects).`;
    const openAISystemPrompt = `${systemPrompt}\n\nYour final output MUST be a single, valid JSON object with keys "recurringContexts" and "scenes". The value of "scenes" must be an array of exactly ${numberOfScenes} scene objects.`;

    // 1. Try OpenAI
    if ((selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
        try {
            if (!openaiApiKey) throw new Error("API Key OpenAI chưa được cấu hình.");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: openAISystemPrompt },
                        { role: 'user', content: `Video Idea: "${videoIdea}"` }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            script = JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.error("OpenAI failed:", e);
            if (selectedAIModel === 'openai') throw e;
            finalError = e;
        }
    }
    
    // 2. Try Gemini
    if (!script && (selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
        try {
            if (!geminiApiKey) throw new Error("API Key Gemini chưa được cấu hình.");
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            
            const sceneSchema = {
                type: (window as any).GenAIType.OBJECT,
                properties: {
                    character: { type: (window as any).GenAIType.STRING },
                    style: { type: (window as any).GenAIType.STRING },
                    scene: { type: (window as any).GenAIType.STRING },
                    characterSummary: { type: (window as any).GenAIType.STRING },
                    contextName: { type: (window as any).GenAIType.STRING },
                    whisk_prompt_vi: { type: (window as any).GenAIType.STRING },
                    whisk_prompt_no_outfit: { type: (window as any).GenAIType.STRING },
                    motion_prompt: { type: (window as any).GenAIType.STRING },
                },
                required: ["character", "style", "scene", "characterSummary", "contextName", "whisk_prompt_vi", "whisk_prompt_no_outfit", "motion_prompt"],
            };
        
            const recurringContextSchema = {
                type: (window as any).GenAIType.OBJECT,
                properties: {
                    name: { type: (window as any).GenAIType.STRING },
                    description: { type: (window as any).GenAIType.STRING },
                    whiskPrompt: { type: (window as any).GenAIType.STRING },
                },
                required: ["name", "description", "whiskPrompt"],
            };
        
            const fullSchema = {
                type: (window as any).GenAIType.OBJECT,
                properties: {
                    recurringContexts: {
                        type: (window as any).GenAIType.ARRAY,
                        items: recurringContextSchema
                    },
                    scenes: {
                        type: (window as any).GenAIType.ARRAY,
                        items: sceneSchema
                    }
                },
                required: ["recurringContexts", "scenes"]
            };

            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json", 
                    responseSchema: fullSchema
                },
            });
            script = JSON.parse(response.text.trim());
        } catch (e) { 
            console.error("Gemini failed:", e);
            finalError = e;
        }
    }

    if (script) {
        return script;
    }

    throw finalError || new Error("Không thể tạo kịch bản. Vui lòng kiểm tra API Key.");
  }, [geminiApiKey, openaiApiKey, selectedAIModel]);

  const handleInitialSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedScenes([]);
    setRecurringContexts([]);
    setScriptHistory([]);
    setCurrentPart(0);
    setTotalParts(0);

    let actualDurationInSeconds = 0;
    const durationNum = parseFloat(totalDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError("Thời lượng video phải là một số dương.");
      setLoading(false);
      return;
    }

    actualDurationInSeconds = durationUnit === 'minutes' ? durationNum * 60 : durationNum;
    const totalScenes = Math.ceil(actualDurationInSeconds / 8);
    const scenesPerPart = 38;
    
    const totalPartsCalc = Math.ceil(totalScenes / scenesPerPart);
    setTotalParts(totalPartsCalc);
    setCurrentPart(1);
    
    const scenesForThisPart = Math.min(scenesPerPart, totalScenes);

    try {
      const content = await generateScript(videoIdea, scenesForThisPart, selectedCinematicStyle, [], 1, totalPartsCalc, []);
      setGeneratedScenes(content.scenes);
      if (content.recurringContexts) {
        setRecurringContexts(content.recurringContexts);
      }
      if (content.scenes.length > 0) {
        setScriptHistory([content.scenes[content.scenes.length - 1].scene]);
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo kịch bản.");
    } finally {
      setLoading(false);
    }
  }, [videoIdea, totalDuration, durationUnit, selectedCinematicStyle, generateScript]);

  const handleGenerateNextPart = useCallback(async () => {
    setIsGeneratingNextPart(true);
    setError(null);

    const scenesPerPart = 38;
    const scenesSoFar = generatedScenes.length;
    const durationNum = parseFloat(totalDuration);
    const actualDurationInSeconds = durationUnit === 'minutes' ? durationNum * 60 : durationNum;
    const totalScenes = Math.ceil(actualDurationInSeconds / 8);
    
    const remainingScenes = totalScenes - scenesSoFar;
    const scenesForThisPart = Math.min(scenesPerPart, remainingScenes);
    const nextPart = currentPart + 1;

    try {
        const content = await generateScript(videoIdea, scenesForThisPart, selectedCinematicStyle, scriptHistory, nextPart, totalParts, recurringContexts);
        
        setGeneratedScenes(prev => [...prev, ...content.scenes]);

        if (content.scenes.length > 0) {
            setScriptHistory(prev => [...prev, content.scenes[content.scenes.length - 1].scene]);
        }
        setCurrentPart(nextPart);

    } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi khi tạo phần tiếp theo.");
    } finally {
        setIsGeneratingNextPart(false);
    }
  }, [generatedScenes, recurringContexts, currentPart, totalParts, scriptHistory, videoIdea, totalDuration, durationUnit, selectedCinematicStyle, generateScript]);

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
    const whiskPrompts = generatedScenes.map(scene => scene.whisk_prompt_vi);
    handleDownloadPrompts(whiskPrompts, 'whisk_prompts.txt');
  };

  const handleDownloadWhiskNoOutfitPrompts = () => {
    const whiskPrompts = generatedScenes.map(scene => scene.whisk_prompt_no_outfit);
    handleDownloadPrompts(whiskPrompts, 'whisk_prompts_no_outfit.txt');
  };

  const handleDownloadFlowPrompts = () => {
    const flowPrompts = generatedScenes.map(scene => scene.motion_prompt);
    handleDownloadPrompts(flowPrompts, 'flow_veo_prompts.txt');
  };

  const handleCopyAllWhisk = () => {
    const allWhiskPrompts = generatedScenes.map(scene => scene.whisk_prompt_vi).join('\n\n\n');
    navigator.clipboard.writeText(allWhiskPrompts).then(() => {
        setCopiedAllWhisk(true);
        setTimeout(() => setCopiedAllWhisk(false), 2000);
    });
  };

  const handleCopyAllWhiskNoOutfit = () => {
    const allWhiskPrompts = generatedScenes.map(scene => scene.whisk_prompt_no_outfit).join('\n\n\n');
    navigator.clipboard.writeText(allWhiskPrompts).then(() => {
        setCopiedAllWhiskNoOutfit(true);
        setTimeout(() => setCopiedAllWhiskNoOutfit(false), 2000);
    });
  };

  const handleCopyAllFlow = () => {
      const allFlowPrompts = generatedScenes.map(scene => scene.motion_prompt).join('\n\n\n');
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
            React.createElement("form", { onSubmit: handleInitialSubmit, className: "bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 sticky top-8" },
              // Form content remains the same
              React.createElement("div", { className: "mb-6" },
                React.createElement("label", { htmlFor: "videoIdea", className: "block text-gray-200 text-sm font-bold mb-2" }, "Ý tưởng video:"),
                React.createElement("textarea", {
                  id: "videoIdea",
                  className: "shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-y",
                  placeholder: "Ví dụ: Một hành trình khám phá...",
                  value: videoIdea,
                  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setVideoIdea(e.target.value),
                  required: true
                })
              ),
              React.createElement("div", { className: "mb-6" },
                React.createElement("label", { htmlFor: "totalDuration", className: "block text-gray-200 text-sm font-bold mb-2" }, "Tổng thời lượng video:"),
                React.createElement("p", { className: "text-xs text-gray-400 mt-1 mb-2" }, "Hệ thống sẽ sáng tạo lần lượt mỗi phần = 5 phút (Tương đương 38 cảnh)"),
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
                disabled: loading || isGeneratingNextPart
              }, loading ? 'Đang tạo phần 1...' : 'Tạo Kịch Bản')
            )
          ),
          // Right Column
          React.createElement("div", { className: "md:w-3/5 lg:w-2/3" },
            loading && React.createElement(Loader, { text: "Đang tạo phần 1..."}),
            error && React.createElement("div", { className: "bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-8", role: "alert" },
              React.createElement("strong", { className: "font-bold" }, "Lỗi!"),
              React.createElement("span", { className: "block sm:inline ml-2" }, error)
            ),
            generatedScenes.length > 0 && (
              React.createElement("div", null,
                 React.createElement("div", { className: "mb-4" },
                    (totalParts > 0) && React.createElement("h2", { className: "text-center text-xl font-bold text-gray-300" }, `Kịch bản Phần ${currentPart} / ${totalParts}`),
                    React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-4 my-8" },
                        React.createElement("div", { className: "bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex flex-col gap-3" },
                            React.createElement("h4", { className: "text-center font-bold text-gray-200" }, "Whisk (Đầy đủ)"),
                            React.createElement("button", { onClick: handleCopyAllWhisk, className: `w-full font-semibold py-2 rounded text-sm ${copiedAllWhisk ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-200 hover:bg-slate-500'}`}, copiedAllWhisk ? "Đã sao chép" : "Sao chép toàn bộ"),
                            React.createElement("button", { onClick: handleDownloadWhiskPrompts, className: "w-full bg-slate-600 hover:bg-slate-500 text-gray-200 font-semibold py-2 rounded text-sm"}, "Tải xuống (.txt)")
                        ),
                        React.createElement("div", { className: "bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex flex-col gap-3" },
                            React.createElement("h4", { className: "text-center font-bold text-yellow-400" }, "Whisk (Không mô tả trang phục)"),
                            React.createElement("button", { onClick: handleCopyAllWhiskNoOutfit, className: `w-full font-semibold py-2 rounded text-sm ${copiedAllWhiskNoOutfit ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-200 hover:bg-slate-500'}`}, copiedAllWhiskNoOutfit ? "Đã sao chép" : "Sao chép toàn bộ"),
                            React.createElement("button", { onClick: handleDownloadWhiskNoOutfitPrompts, className: "w-full bg-slate-600 hover:bg-slate-500 text-gray-200 font-semibold py-2 rounded text-sm"}, "Tải xuống (.txt)")
                        ),
                        React.createElement("div", { className: "bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex flex-col gap-3" },
                            React.createElement("h4", { className: "text-center font-bold text-indigo-400" }, "Flow VEO 3.1"),
                            React.createElement("button", { onClick: handleCopyAllFlow, className: `w-full font-semibold py-2 rounded text-sm ${copiedAllFlow ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-200 hover:bg-slate-500'}`}, copiedAllFlow ? "Đã sao chép" : "Sao chép toàn bộ"),
                            React.createElement("button", { onClick: handleDownloadFlowPrompts, className: "w-full bg-slate-600 hover:bg-slate-500 text-gray-200 font-semibold py-2 rounded text-sm"}, "Tải xuống (.txt)")
                        )
                    )
                ),
                
                recurringContexts.length > 0 && React.createElement("div", { className: "mb-8" },
                    React.createElement("h3", { className: "text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500/30 pb-2" }, "Thống kê Bối cảnh"),
                    React.createElement("div", { className: "space-y-4" },
                        recurringContexts.map(context => React.createElement(ContextCard, { key: context.name, context: context }))
                    )
                ),

                generatedScenes.map((scene, index) => React.createElement(SceneCard, { key: index, scene: scene, sceneNumber: index + 1 })),
                
                (currentPart < totalParts) && React.createElement("button", {
                    onClick: handleGenerateNextPart,
                    disabled: isGeneratingNextPart,
                    className: "w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none transition-colors disabled:opacity-50"
                }, isGeneratingNextPart ? `Đang tạo phần ${currentPart + 1}...` : `Tạo Phần Tiếp Theo (${currentPart + 1}/${totalParts})`),

                isGeneratingNextPart && React.createElement(Loader, { text: `Đang tạo phần ${currentPart + 1}...`})
              )
            )
          )
        )
    )
  );
};

export default MyChannelApp;
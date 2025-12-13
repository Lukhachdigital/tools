import React, { useState, useCallback } from 'react';

// --- TYPES ---
interface Scene {
  character: string;
  style: string;
  scene: string;
  characterSummary: string;
  whisk_prompt_vi: string;
  motion_prompt: string;
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

const SceneCard = ({ scene, sceneNumber }: { scene: Scene; sceneNumber: number }): React.ReactElement => {
  const [copiedWhisk, setCopiedWhisk] = useState(false);
  const [copiedFlow, setCopiedFlow] = useState(false);

  const copyToClipboard = (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    React.createElement("div", { className: "bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700" },
      React.createElement("h3", { className: "text-xl font-bold text-blue-400 mb-2" }, `Cảnh ${sceneNumber}`),
      scene.characterSummary && React.createElement("p", { className: "text-sm text-gray-400 mb-4 italic" },
        React.createElement("span", { className: "font-semibold" }, "Nhân vật chính: "),
        scene.characterSummary
      ),
      React.createElement("div", { className: "mt-4" },
        React.createElement("p", { className: "font-bold text-lg text-gray-100 mb-2" }, "Prompt cho Whisk (Ảnh tĩnh, Tiếng Việt):"),
        React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
          React.createElement("p", { className: "text-gray-200 text-sm break-words pr-20" }, scene.whisk_prompt_vi),
          React.createElement("button", {
            onClick: () => copyToClipboard(scene.whisk_prompt_vi, setCopiedWhisk),
            className: `absolute top-2 right-2 px-4 py-2 text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${copiedWhisk ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`
          }, copiedWhisk ? 'Đã sao chép' : 'Sao chép')
        )
      ),
      React.createElement("div", { className: "mt-6" },
        React.createElement("p", { className: "font-bold text-lg text-gray-100 mb-2" }, "Prompt cho Flow VEO 3.1 (Chuyển động):"),
        React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
          React.createElement("p", { className: "text-gray-200 text-sm break-words pr-20" }, scene.motion_prompt),
          React.createElement("button", {
            onClick: () => copyToClipboard(scene.motion_prompt, setCopiedFlow),
            className: `absolute top-2 right-2 px-4 py-2 text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${copiedFlow ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`
          }, copiedFlow ? 'Đã sao chép' : 'Sao chép')
        )
      )
    )
  );
};

const cinematicStyles = [
  "Hiện đại", "Điện ảnh", "Viễn tưởng", "Tiền sử", "Hoạt hình", "Hài hước"
];

// --- APP COMPONENT ---
const WhiskFlowApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }): React.ReactElement => {
  const [videoIdea, setVideoIdea] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('minutes');
  const [selectedCinematicStyle, setSelectedCinematicStyle] = useState('Hiện đại');
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generateScript = useCallback(async (
    videoIdea: string,
    numberOfScenes: number,
    cinematicStyle: string,
    model: string
  ): Promise<Scene[]> => {
    
    const styleInstruction = `The overall cinematic style for this video should be: ${cinematicStyle}. Elaborate on this style in each scene's 'style' field.`;

    const whiskPromptDescription = cinematicStyle === "Hoạt hình"
      ? `Concise, cinematic, sufficiently detailed, and emotionally evocative VIETNAMESE prompt for static image generation on Whisk, in an ANIMATED style. Crucially, this prompt MUST describe the context (bối cảnh) clearly and in detail, consistent with the scene description. This is mandatory for every single prompt. Focus on the visual composition and mood. DO NOT describe faces, clothes, gender, or identity.`
      : `Concise, cinematic, sufficiently detailed, and emotionally evocative VIETNAMESE prompt for static image generation on Whisk. The prompt MUST explicitly request a PHOTOREALISTIC, truthful, and realistic image. Crucially, this prompt MUST describe the context (bối cảnh) clearly and in detail, consistent with the scene description. This is mandatory for every single prompt. Focus on the visual composition and mood. DO NOT describe faces, clothes, gender, or identity.`;

    const commonPrompt = `
  You are an AI film scriptwriting tool that generates scene descriptions and prompts for image and video generation systems (Whisk and Flow VEO 3.1).
  Your task is to take a video idea and a total duration, divide it into 8-second scenes, and for each scene, generate a structured output. Each scene description should immediately present a high-climax visual or a pivotal moment. The narrative should focus on impactful, visually striking events directly.

  **CREATIVITY MANDATE:** For every new request, you MUST generate a completely new story, unique characters, and a fresh sequence of prompts. Repetitive or formulaic responses are not acceptable.

  **CRITICAL RULES TO FOLLOW:**
  1.  **Mandatory Context:** For EVERY scene without exception, the 'scene' description and the 'whisk_prompt_vi' MUST clearly and detailedly describe the context (bối cảnh). This rule is absolute.
  2.  **Perfect Character Accuracy:** The 'characterSummary' field MUST be 100% accurate for every scene. Adhere strictly to the character counting rules. Inaccuracy is not acceptable.
  3.  **Specific Animal Descriptions (Whisk Prompt):** When a character is an animal (summarized as '1 Thú'), the 'whisk_prompt_vi' MUST specifically name the type of animal. For example, instead of a generic description, use phrases like 'một con nai oai vệ' (a majestic deer), 'một con voi xám khổng lồ' (a giant grey elephant), or 'một con sói đơn độc' (a lone wolf). This is mandatory for all scenes involving an animal.

  Crucially, ensure the generated script maintains strong contextual consistency between the "Video Idea" and the selected "Cinematic style." For example, if the video idea involves a "forest man" and the cinematic style is "cinematic," do not include modern items like walkie-talkies or compasses in the scene descriptions or prompts. All elements (environment, objects, actions) must be thematically aligned with the core concept.
  `;

    const systemPrompt = `${commonPrompt}
    Your final output must be a single, valid JSON object with one key: "scenes". The value of "scenes" should be an array of scene objects. Each scene object must contain the following keys: "character", "style", "scene", "characterSummary", "whisk_prompt_vi", "motion_prompt".`;

    const userPrompt = `Video Idea: "${videoIdea}"
    This video will be divided into ${numberOfScenes} scenes, each 8 seconds long.
    ${styleInstruction}
    whisk_prompt_vi description: "${whiskPromptDescription}"
    Generate a JSON object with a "scenes" array containing ${numberOfScenes} scene objects.`;

    let finalError: unknown;
    let scenes: Scene[] | null = null;

    // 1. Try Gemini (Priority)
    if (model === 'gemini' || (model === 'auto' && geminiApiKey)) {
        try {
            if (!geminiApiKey) throw new Error("Gemini API Key chưa được cấu hình.");
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            const sceneSchema = {
              type: window.GenAIType.OBJECT,
              properties: {
                character: { type: window.GenAIType.STRING, description: "Left empty, user will attach reference character in Whisk." },
                style: { type: window.GenAIType.STRING, description: "Cinematic style, lighting, tone, depth of field, visual texture, camera." },
                scene: { type: window.GenAIType.STRING, description: "Context, action, emotion, lighting, environment. NO specific character description. In Vietnamese." },
                characterSummary: { type: window.GenAIType.STRING, description: "Summarize the main characters in this scene." },
                whisk_prompt_vi: { type: window.GenAIType.STRING, description: "Vietnamese prompt for static image generation on Whisk." },
                motion_prompt: { type: window.GenAIType.STRING, description: "English prompt for Flow VEO 3.1." },
              },
              required: ["character", "style", "scene", "characterSummary", "whisk_prompt_vi", "motion_prompt"],
            };
            
            const response = await ai.models.generateContent({
              model: "gemini-3-pro-preview",
              contents: `${systemPrompt}\n\n${userPrompt}`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: window.GenAIType.OBJECT,
                    properties: {
                        scenes: {
                            type: window.GenAIType.ARRAY,
                            items: sceneSchema
                        }
                    }
                }
              },
            });
            const jsonStr = response.text.trim();
            const parsedResponse = JSON.parse(jsonStr);
            if (parsedResponse.scenes) scenes = parsedResponse.scenes;
        } catch (e) {
            console.warn("Gemini failed", e);
            if (model === 'gemini') throw e;
            finalError = e; // Store final error
        }
    }

    // 2. Try OpenAI (Fallback)
    if (!scenes && (model === 'openai' || (model === 'auto' && openaiApiKey))) {
        try {
            if (!openaiApiKey) throw new Error("OpenAI API Key chưa được cấu hình.");
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
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const jsonText = data.choices[0].message.content;
            const parsedResponse = JSON.parse(jsonText);
            if (parsedResponse.scenes) scenes = parsedResponse.scenes;
        } catch (e) {
            console.warn("OpenAI failed", e);
            finalError = e; 
        }
    }

    if (scenes) {
        return scenes;
    }

    throw finalError || new Error("Không thể tạo kịch bản. Vui lòng kiểm tra API Key và thử lại.");

  }, [geminiApiKey, openaiApiKey]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedScenes([]);
    setCopiedAll(false);

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
      const scenes = await generateScript(videoIdea, numberOfScenes, selectedCinematicStyle, selectedAIModel);
      setGeneratedScenes(scenes);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo kịch bản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [videoIdea, totalDuration, durationUnit, selectedCinematicStyle, generateScript, selectedAIModel]);

  const handleDownloadPrompts = (prompts: string[], filename: string) => {
    const content = prompts.map((prompt, index) => `Cảnh ${index + 1}:\n${prompt}`).join('\n\n');
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
    handleDownloadPrompts(whiskPrompts, 'whisk_prompts_vi.txt');
  };

  const handleDownloadFlowPrompts = () => {
    const flowPrompts = generatedScenes.map(scene => scene.motion_prompt);
    handleDownloadPrompts(flowPrompts, 'flow_veo_prompts.txt');
  };

  const handleCopyAll = () => {
      const allContent = generatedScenes.map(scene => 
          `${scene.whisk_prompt_vi}\n\n\n${scene.motion_prompt}`
      ).join('\n\n\n');
      
      navigator.clipboard.writeText(allContent).then(() => {
          setCopiedAll(true);
          setTimeout(() => setCopiedAll(false), 2000);
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
                    placeholder: "Ví dụ: 30", min: "1", step: "any", value: totalDuration,
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
          React.createElement("div", { className: "md:w-3/5 lg:w-2/3 md:h-[calc(100vh-150px)] md:overflow-y-auto custom-scrollbar md:pr-4" },
            loading && React.createElement(Loader, null),
            error && React.createElement("div", { className: "bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-8", role: "alert" },
              React.createElement("strong", { className: "font-bold" }, "Lỗi!"),
              React.createElement("span", { className: "block sm:inline ml-2" }, error)
            ),
            generatedScenes.length > 0 && (
              React.createElement("div", null,
                React.createElement("div", { className: "flex flex-col sm:flex-row justify-center gap-4 mb-8" },
                  React.createElement("button", { onClick: handleDownloadWhiskPrompts, className: "flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors duration-200", disabled: loading || generatedScenes.length === 0 }, "Tải xuống Prompt Whisk (.txt)"),
                  React.createElement("button", { onClick: handleDownloadFlowPrompts, className: "flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors duration-200", disabled: loading || generatedScenes.length === 0 }, "Tải xuống Prompt Flow VEO 3.1 (.txt)"),
                  React.createElement("button", { 
                      onClick: handleCopyAll, 
                      className: `flex-1 font-bold py-3 px-4 rounded-md focus:outline-none transition-colors duration-200 ${copiedAll ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`,
                      disabled: loading || generatedScenes.length === 0 
                  }, copiedAll ? "Đã sao chép tất cả" : "Sao chép toàn bộ")
                ),
                generatedScenes.map((scene, index) => React.createElement(SceneCard, { key: index, scene: scene, sceneNumber: index + 1 }))
              )
            )
          )
        )
    )
  );
};

export default WhiskFlowApp;
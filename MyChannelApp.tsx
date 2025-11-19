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
            className: "absolute top-2 right-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-green-600",
            disabled: copiedWhisk
          }, copiedWhisk ? 'Đã sao chép!' : 'Sao chép')
        )
      ),
      React.createElement("div", { className: "mt-6" },
        React.createElement("p", { className: "font-bold text-lg text-gray-100 mb-2" }, "Prompt cho Flow VEO 3.1 (Chuyển động):"),
        React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
          React.createElement("p", { className: "text-gray-200 text-sm break-words pr-20" }, scene.motion_prompt),
          React.createElement("button", {
            onClick: () => copyToClipboard(scene.motion_prompt, setCopiedFlow),
            className: "absolute top-2 right-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-green-600",
            disabled: copiedFlow
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScript = useCallback(async (
    videoIdea: string,
    numberOfScenes: number,
    cinematicStyle: string
  ): Promise<Scene[]> => {
    
    const styleSpecificWhiskInstruction = cinematicStyle === "Hoạt hình"
      ? `The prompt MUST be for an ANIMATED style.`
      : `The prompt MUST explicitly request a PHOTOREALISTIC, truthful, and realistic image.`;

    const commonPrompt = `
  You are an AI film scriptwriting tool that generates scene descriptions and prompts for image and video generation systems (Whisk and Flow VEO 3.1). Your main goal is to ensure visual consistency for characters and locations across multiple scenes.

  **INTERNAL CONSISTENCY PLAN (DO NOT include in final JSON output):**
  Before generating the script, you MUST first create an internal "consistency sheet" for yourself.
  1.  **Character Sheet:** Define the main character(s).
  2.  **Outfit Sheet:** Define specific outfits the character(s) will wear. Give each outfit a name (e.g., "Outfit A: rugged explorer gear", "Outfit B: formal tuxedo"). Note which scenes each outfit is worn in.
  3.  **Location Sheet:** Define the key locations. Give each location a name (e.g., "Location X: dense jungle temple", "Location Y: modern city street at night"). Note which scenes take place in each location.
  4.  **Reference this sheet** for EVERY scene to ensure the descriptions are perfectly consistent.

  **CRITICAL RULES FOR JSON OUTPUT:**
  1.  **Gender/Identity in Whisk Prompt:** For every scene, the 'whisk_prompt_vi' MUST start by identifying the character. Use their gender (e.g., "Một người đàn ông", "Một người phụ nữ") or a specific identity if they are not human (e.g., "Một con robot", "Một con rồng"). DO NOT describe age, face, or body shape. This is because the user provides a reference photo on Whisk.
  2.  **Outfit & Accessory Consistency:** If a character wears the same outfit (e.g., "Outfit A") across multiple scenes, the description of their clothing and any accessories in the 'whisk_prompt_vi' for those scenes MUST be **IDENTICAL**. Use the exact same wording from your internal sheet.
  3.  **Background Consistency:** If a scene takes place in a location that is used in other scenes (e.g., "Location X"), the description of the background in 'whisk_prompt_vi' MUST be detailed and **IDENTICAL** across all scenes in that location. If a background appears only once, a detailed description is not required.
  4.  **Mandatory Context:** The 'scene' description must still clearly describe the overall context (bối cảnh).
  5.  **Character Summary Accuracy:** The 'characterSummary' field MUST be 100% accurate for every scene.
  `;
    
    try {
        if (selectedAIModel === 'gemini') {
            if (!geminiApiKey) {
                throw new Error("API Key Gemini chưa được cấu hình.");
            }
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
    
            const sceneSchema = {
              type: window.GenAIType.OBJECT,
              properties: {
                character: { type: window.GenAIType.STRING, description: "Left empty, user will attach reference character in Whisk." },
                style: { type: window.GenAIType.STRING, description: "Cinematic style, lighting, tone, depth of field, visual texture, camera." },
                scene: { type: window.GenAIType.STRING, description: "Context, action, emotion, lighting, environment. NO specific character description. In Vietnamese." },
                characterSummary: { type: window.GenAIType.STRING, description: "Summarize the main characters in this scene, e.g., '1 Nam', '1 Nữ', '1 Thú', '1 Nam và 1 Nữ', '1 Nam và 1 Thú', 'Không có nhân vật chính'." },
                whisk_prompt_vi: { type: window.GenAIType.STRING, description: "VIETNAMESE prompt for Whisk. Must start with character's gender/identity. Must have consistent descriptions for recurring outfits, accessories, and backgrounds. Must be cinematic and evocative." },
                motion_prompt: { type: window.GenAIType.STRING, description: "English prompt for Flow VEO 3.1. Describes camera movement, dynamic lighting, emotional rhythm, moving objects or environment. No faces, clothes, gender, identity." },
              },
              required: ["character", "style", "scene", "characterSummary", "whisk_prompt_vi", "motion_prompt"],
            };
    
            const fullSchema = { type: window.GenAIType.ARRAY, items: sceneSchema };
    
            const prompt = `${commonPrompt}
              Video Idea: "${videoIdea}"
              This video will be divided into ${numberOfScenes} scenes, each 8 seconds long.
              The overall cinematic style for this video should be: ${cinematicStyle}.
        
              For each scene, generate the following structure as a JSON array, strictly following all consistency rules above:
        
              {
                "character": "Leave empty — user will attach reference character in Whisk. Provide an empty string.",
                "style": "Cinematic style, lighting, tone, depth of field, visual texture, camera.",
                "scene": "In Vietnamese, describe the context (bối cảnh), action, emotion, lighting, and environment. DO NOT describe specific characters (faces, clothes, gender, identity).",
                "characterSummary": "Summarize the main characters (e.g., '1 Nam', '1 Nữ', '1 Thú'). This MUST be accurate.",
                "whisk_prompt_vi": "VIETNAMESE prompt for Whisk. ${styleSpecificWhiskInstruction} Must start with character's gender/identity. Must have consistent descriptions for recurring outfits, accessories, and backgrounds. Must be cinematic and evocative.",
                "motion_prompt": "English prompt for Flow VEO 3.1. Describe camera movement, dynamic lighting, etc. DO NOT describe faces, clothes, gender, or identity."
              }
        
              Generate a JSON array with ${numberOfScenes} scene objects.
              `;
      
            const response = await ai.models.generateContent({
              model: "gemini-2.5-pro",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: fullSchema,
              },
            });
      
            const jsonStr = response.text.trim();
            return JSON.parse(jsonStr) as Scene[];
        } else { // OpenAI
            if (!openaiApiKey) {
                throw new Error("API Key OpenAI chưa được cấu hình.");
            }
            const systemPrompt = `${commonPrompt}
            You must return a single JSON object with a key "scenes" which is an array of scene objects. Each scene object must contain the following keys: "character", "style", "scene", "characterSummary", "whisk_prompt_vi", "motion_prompt".`;

            const userPrompt = `Video Idea: "${videoIdea}"
            This video will be divided into ${numberOfScenes} scenes, each 8 seconds long.
            The overall cinematic style for this video should be: ${cinematicStyle}.
            whisk_prompt_vi style: "${styleSpecificWhiskInstruction}"
            Generate a JSON object with a "scenes" array containing ${numberOfScenes} scene objects.`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-5.1',
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
            
            if (!parsedResponse.scenes || !Array.isArray(parsedResponse.scenes)) {
              throw new Error("Invalid response format from OpenAI. Expected a 'scenes' array.");
            }
            
            return parsedResponse.scenes;
        }
    } catch (error) {
      console.error("Error generating script:", error);
      throw new Error("Failed to generate script. Please try again.");
    }
  }, [geminiApiKey, openaiApiKey, selectedAIModel]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedScenes([]);

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
      const scenes = await generateScript(videoIdea, numberOfScenes, selectedCinematicStyle);
      setGeneratedScenes(scenes);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo kịch bản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [videoIdea, totalDuration, durationUnit, selectedCinematicStyle, generateScript]);

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
                  React.createElement("button", { onClick: handleDownloadFlowPrompts, className: "flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors duration-200", disabled: loading || generatedScenes.length === 0 }, "Tải xuống Prompt Flow VEO 3.1 (.txt)")
                ),
                generatedScenes.map((scene, index) => React.createElement(SceneCard, { key: index, scene: scene, sceneNumber: index + 1 }))
              )
            )
          )
        )
    )
  );
};

export default MyChannelApp;
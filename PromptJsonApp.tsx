import React, { useState } from 'react';

// =================================================================
// SHARED COMPONENTS
// =================================================================

const Button = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-bold text-sm transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    active: 'bg-blue-600 text-white ring-2 ring-blue-400',
  };
  const buttonStyle = variantStyles[variant] || variantStyles.primary;
  return (
    React.createElement('button', { className: `${baseStyles} ${buttonStyle} ${className}`, ...props }, children)
  );
};

const Input = ({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; }) => {
  const baseStyles = 'w-full bg-slate-800 border border-slate-600 rounded-md p-3 text-base text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';
  if (label) {
    return (
      React.createElement('div', null,
        React.createElement('label', { className: "block text-sm font-semibold mb-1" }, label),
        React.createElement('input', { className: `${baseStyles} ${className}`, ...props })
      )
    );
  }
  return React.createElement('input', { className: `${baseStyles} ${className}`, ...props });
};

// =================================================================
// UI HELPERS & UTILS
// =================================================================

const Spinner = () => (
    React.createElement('svg', { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" },
        React.createElement('circle', { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
        React.createElement('path', { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
    )
);

const ErrorDisplay = ({ message }) => (
    React.createElement('div', { className: "p-4 bg-red-900/50 border border-red-500 rounded-lg text-center" },
        React.createElement('p', { className: "text-red-400 text-sm font-semibold" }, "Error"),
        React.createElement('p', { className: "text-xs text-red-300 mt-1" }, message)
    )
);

interface PromptObject {
  Objective: string;
  Persona: {
    Role: string;
    Tone: string;
    Knowledge_Level: string;
  };
  Task_Instructions: string[];
  Constraints: string[];
  Input_Examples: Array<{
    Input: string;
    Expected_Output: string;
  }>;
  Output_Format: {
    Type: string;
    Structure: {
      character_details: string;
      setting_details: string;
      key_action: string;
      camera_direction: string;
    };
  };
}

interface Scene {
  scene: number;
  description: string;
  prompt: PromptObject;
}

const parseDurationToSeconds = (durationStr) => {
  if (!durationStr.trim()) return null;
  let totalSeconds = 0;
  const minutesMatches = durationStr.match(/(\d+(\.\d+)?)\s*(phút|minute|min|m)/i);
  if (minutesMatches) {
    totalSeconds += parseFloat(minutesMatches[1]) * 60;
  }
  const secondsMatches = durationStr.match(/(\d+(\.\d+)?)\s*(giây|second|sec|s)/i);
  if (secondsMatches) {
    totalSeconds += parseFloat(secondsMatches[1]);
  }
  if (totalSeconds === 0 && /^\d+(\.\d+)?$/.test(durationStr.trim())) {
    totalSeconds = parseFloat(durationStr.trim());
  }
  return totalSeconds > 0 ? totalSeconds : null;
};

const getApiErrorMessage = (error) => {
  let message = 'An unknown error occurred during generation.';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  try {
    const jsonMatch = message.match(/\{.*\}/s);
    if (jsonMatch) {
      const errorObj = JSON.parse(jsonMatch[0]);
      const nestedError = errorObj.error || errorObj;

      if (nestedError.status === 'UNAVAILABLE' || nestedError.code === 503) {
        return 'Lỗi từ API: Model đang bị quá tải. Vui lòng thử lại sau ít phút.';
      }
      if (nestedError.message && (nestedError.message.includes('API key not valid') || nestedError.message.includes('API_KEY_INVALID'))) {
        return 'Lỗi API: API key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt API Key.';
      }
      if (nestedError.message) {
        return `Lỗi từ API: ${nestedError.message}`;
      }
    }
  } catch (e) {}

  if (message.includes('Incorrect API key')) {
    return 'Lỗi API: API key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt API Key.';
  }
  if (message.toLowerCase().includes('rate limit')) {
    return 'Lỗi API: Bạn đã vượt quá giới hạn sử dụng.';
  }
  
  return `Không thể tạo kịch bản. Chi tiết lỗi: ${message}`;
};


const PromptJsonApp = ({ geminiApiKey, openaiApiKey, openRouterApiKey }) => {
  const [idea, setIdea] = useState('');
  const [duration, setDuration] = useState('');
  const [results, setResults] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copiedScene, setCopiedScene] = useState(null);

  const systemInstruction = `You are an expert scriptwriter and AI prompt engineer. Your task is to transform a user's simple idea into a detailed script. For each scene, you must generate a highly structured, detailed JSON prompt object designed to guide another AI in creating a consistent video clip.

**INTERNAL MONOLOGUE & CONSISTENCY PLAN (CRITICAL):**
Before generating the JSON output, you MUST first create an internal plan. This plan will NOT be part of the final output.
1.  **Define Core Entities:** Create a detailed "entity sheet" for all main characters and key locations.
    *   **For Characters:** Specify their species, gender, age, clothing, hair color/style, facial features, unique marks (e.g., "a 25-year-old male explorer with short, messy brown hair, a rugged leather jacket over a grey t-shirt, cargo pants, and a noticeable scar above his left eyebrow").
    *   **For Locations:** Describe the key elements, atmosphere, lighting, and time of day (e.g., "a dense, Amazonian jungle at dusk, with thick fog clinging to the ground, giant glowing mushrooms providing an eerie blue light").
2.  **Reference the Plan:** For every scene you generate, you MUST refer back to this entity sheet and use the exact descriptive details to populate the fields in the structured JSON prompt. This is the key to consistency.

**LANGUAGE REQUIREMENT (CRITICAL):**
- The top-level "description" field for each scene MUST be in VIETNAMESE.
- All content inside the nested "prompt" JSON object MUST be in ENGLISH.

**STRUCTURED PROMPT FOR EACH SCENE (CRITICAL):**
For each scene, the "prompt" field must be a JSON object that strictly adheres to the following structure. You will populate it with details from your internal plan and the specific actions of the scene.

{
  "Objective": "State the primary goal for the AI video generator for this specific scene. E.g., 'To create a photorealistic, 8-second, 4K cinematic clip of the protagonist discovering a hidden temple.'",
  "Persona": {
    "Role": "Define the role the video AI should adopt. E.g., 'An expert cinematographer and visual effects artist.'",
    "Tone": "Specify the desired artistic tone. E.g., 'Suspenseful, epic, mysterious, dramatic.'",
    "Knowledge_Level": "Assume the AI has expert-level knowledge. E.g., 'Expert in Hollywood-style visual storytelling.'"
  },
  "Task_Instructions": [
    "Provide a bulleted list of step-by-step instructions for the AI. Be very specific. Use details from your consistency plan.",
    "Example 1: 'Depict the main character, a 25-year-old male explorer with a scar over his left eye, pushing aside thick jungle vines.'",
    "Example 2: 'The setting is the Amazonian jungle at dusk, with eerie blue light from glowing mushrooms illuminating the scene.'",
    "Example 3: 'Use a slow, dramatic dolly zoom camera shot to build tension as he reveals the temple entrance.'"
  ],
  "Constraints": [
    "List any rules or limitations.",
    "E.g., 'The video clip must be exactly 8 seconds long.'",
    "E.g., 'Do not show any other characters in this scene.'",
    "E.g., 'Maintain a photorealistic style throughout.'"
  ],
  "Input_Examples": [
    {
      "Input": "A simple text description of a similar, successful scene.",
      "Expected_Output": "A brief description of the high-quality video that should result."
    }
  ],
  "Output_Format": {
    "Type": "Specify the final output type. E.g., 'video/mp4'",
    "Structure": {
        "character_details": "A concise summary of the character's appearance and gear for this scene, copied from your plan.",
        "setting_details": "A concise summary of the location, time, and atmosphere, copied from your plan.",
        "key_action": "The single most important action occurring in the scene.",
        "camera_direction": "The specific camera shot to use (e.g., 'dolly zoom', 'crane shot', 'tracking shot')."
    }
  }
}`;

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError("Vui lòng nhập ý tưởng nội dung.");
      return;
    }

    if (!geminiApiKey && !openaiApiKey && !openRouterApiKey) {
        setError("Vui lòng cài đặt ít nhất một API Key.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setResults([]);

    let userPrompt = `Generate a script and video prompts based on these details:\n\nIdea: "${idea}"`;
    const totalSeconds = parseDurationToSeconds(duration);
    if (totalSeconds) {
        const requiredScenes = Math.ceil(totalSeconds / 8);
        userPrompt += `\n\nRequirement: The final video should be approximately ${duration} (${totalSeconds} seconds). To achieve this, you MUST generate exactly ${requiredScenes} scenes, as each scene will become an 8-second video clip.`;
    } else {
        userPrompt += `\n\nDesired Video Duration: "${duration || 'not specified'}"`;
    }

    const openAISystemInstruction = `${systemInstruction}\n\n**OUTPUT FORMAT (CRITICAL):**\nYour final output must be a single, valid JSON object with one key: "scenes". The value of "scenes" should be an array of objects, where each object represents a scene. Each scene object must contain 'scene', 'description', and 'prompt' keys.`;

    let finalError = null;

    // 1. Try OpenRouter
    if (openRouterApiKey) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openRouterApiKey}`
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        { role: 'system', content: openAISystemInstruction },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenRouter API failed');
            const data = await response.json();
            const parsedResponse = JSON.parse(data.choices[0].message.content);
            if (!parsedResponse.scenes || !Array.isArray(parsedResponse.scenes)) throw new Error("Invalid JSON structure");
            setResults(parsedResponse.scenes);
            setIsGenerating(false);
            return;
        } catch (e) {
            console.warn("OpenRouter failed, trying Gemini...", e);
            finalError = e;
        }
    }

    // 2. Try Gemini
    if (geminiApiKey) {
        try {
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: window.GenAIType.ARRAY,
                        items: {
                            type: window.GenAIType.OBJECT,
                            properties: {
                                scene: { type: window.GenAIType.INTEGER },
                                description: { type: window.GenAIType.STRING },
                                prompt: {
                                    type: window.GenAIType.OBJECT,
                                    properties: {
                                        Objective: { type: window.GenAIType.STRING },
                                        Persona: {
                                            type: window.GenAIType.OBJECT,
                                            properties: { Role: { type: window.GenAIType.STRING }, Tone: { type: window.GenAIType.STRING }, Knowledge_Level: { type: window.GenAIType.STRING } },
                                            required: ['Role', 'Tone', 'Knowledge_Level'],
                                        },
                                        Task_Instructions: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } },
                                        Constraints: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } },
                                        Input_Examples: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.OBJECT, properties: { Input: { type: window.GenAIType.STRING }, Expected_Output: { type: window.GenAIType.STRING } }, required: ['Input', 'Expected_Output'] } },
                                        Output_Format: {
                                            type: window.GenAIType.OBJECT,
                                            properties: { Type: { type: window.GenAIType.STRING }, Structure: { type: window.GenAIType.OBJECT, properties: { character_details: { type: window.GenAIType.STRING }, setting_details: { type: window.GenAIType.STRING }, key_action: { type: window.GenAIType.STRING }, camera_direction: { type: window.GenAIType.STRING } }, required: ['character_details', 'setting_details', 'key_action', 'camera_direction'] } },
                                            required: ['Type', 'Structure'],
                                        },
                                    },
                                    required: ['Objective', 'Persona', 'Task_Instructions', 'Constraints', 'Input_Examples', 'Output_Format'],
                                },
                            },
                            required: ['scene', 'description', 'prompt'],
                        },
                    },
                },
            });
            const parsedResults = JSON.parse(response.text.trim());
            setResults(parsedResults);
            setIsGenerating(false);
            return;
        } catch (e) {
            console.warn("Gemini failed, trying OpenAI...", e);
            finalError = e;
        }
    }

    // 3. Try OpenAI
    if (openaiApiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: openAISystemInstruction },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenAI API failed');
            const data = await response.json();
            const parsedResponse = JSON.parse(data.choices[0].message.content);
            if (!parsedResponse.scenes || !Array.isArray(parsedResponse.scenes)) throw new Error("Invalid JSON");
            setResults(parsedResponse.scenes);
            setIsGenerating(false);
            return;
        } catch (e) {
            console.warn("OpenAI failed", e);
            finalError = e;
        }
    }

    setError(getApiErrorMessage(finalError || new Error("All providers failed")));
    setIsGenerating(false);
  };

  const handleCopyPrompt = (promptText, sceneNumber) => {
    navigator.clipboard.writeText(promptText).then(() => {
        setCopiedScene(sceneNumber);
        setTimeout(() => setCopiedScene(null), 2000);
    }).catch(err => {
        setError(`Could not copy text: ${err}`);
        setTimeout(() => setError(null), 4000);
    });
  };
  
  const handleDownloadPrompts = () => {
    const promptsOnly = results.reduce((acc, scene) => {
      acc[`scene_${scene.scene}`] = scene.prompt;
      return acc;
    }, {});
    
    const jsonString = JSON.stringify(promptsOnly, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_prompts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadScript = () => {
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_script.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    React.createElement('div', { className: 'w-full h-full flex flex-col p-4' },
      React.createElement('main', { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow" },
        React.createElement('div', { className: "space-y-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-700" },
          React.createElement('div', null,
            React.createElement('label', { htmlFor: "idea-textarea", className: "block text-sm font-semibold mb-1" },
              "1. Nhập Content / Ý tưởng"
            ),
            (() => {
              const textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
                id: "idea-textarea",
                className: "w-full h-40 bg-slate-800 border border-slate-600 rounded-md p-3 text-base text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                placeholder: "Ví dụ: Cuộc đại chiến tranh giành lãnh thổ giữa Kong và một con Gấu khổng lồ trong khu rừng rậm Amazon.",
                value: idea,
                onChange: (e) => setIdea(e.target.value),
                disabled: isGenerating,
              };
              return React.createElement('textarea', textareaProps);
            })()
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: "duration-input", className: "block text-sm font-semibold mb-1" },
              "2. Cài đặt thời lượng Video (tùy chọn)"
            ),
            (() => {
                const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
                    id: "duration-input",
                    placeholder: "Ví dụ: 30 giây, 1 phút, 90s...",
                    value: duration,
                    onChange: (e) => setDuration(e.target.value),
                    disabled: isGenerating,
                };
                return React.createElement(Input, inputProps);
            })()
          ),
          React.createElement(Button, {
            variant: "primary",
            className: "w-full text-lg py-3",
            onClick: handleGenerate,
            disabled: isGenerating || !idea.trim(),
            children: isGenerating ? 
              React.createElement('span', { className: "flex items-center justify-center" }, React.createElement(Spinner), " Đang tạo...") : 
              '3. Tạo kịch bản & Prompt'
          })
        ),
        
        React.createElement('div', { className: "bg-slate-900/50 border border-slate-700 rounded-2xl p-6 min-h-[300px] flex flex-col" },
          React.createElement('div', { className: "flex justify-between items-center mb-2" },
            React.createElement('h3', { className: "text-lg font-bold text-white" }, "Kết quả"),
            results.length > 0 && (
              React.createElement('div', { className: "flex items-center space-x-2" },
                React.createElement(Button, { onClick: handleDownloadPrompts, variant: "secondary", className: "text-xs py-1", children: "Download JSON" }),
                React.createElement(Button, { onClick: handleDownloadScript, variant: "secondary", className: "text-xs py-1", children: "Download Kịch bản" })
              )
            )
          ),
          React.createElement('div', { className: "flex-grow overflow-y-auto space-y-3 pr-2" },
            isGenerating && (
                React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center" },
                    React.createElement(Spinner),
                    React.createElement('p', { className: "mt-2 text-cyan-400" }, "AI đang viết, vui lòng chờ..."),
                    React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, "Quá trình này có thể mất một lúc.")
                )
            ),
            error && React.createElement(ErrorDisplay, { message: error }),
            !isGenerating && results.length === 0 && !error && (
              React.createElement('p', { className: "text-center text-gray-500 pt-8" }, "Kịch bản và các câu lệnh sẽ xuất hiện ở đây.")
            ),
            results.map((scene) => (
              React.createElement('div', { key: scene.scene, className: "bg-slate-800 border border-slate-700 p-3 rounded-lg space-y-2" },
                React.createElement('h4', { className: "font-bold text-cyan-400" }, `Cảnh ${scene.scene}`),
                React.createElement('div', null,
                  React.createElement('h5', { className: "text-sm font-semibold text-gray-100" }, "Mô tả cảnh:"),
                  React.createElement('p', { className: "text-sm text-gray-300 mt-1" }, scene.description)
                ),
                React.createElement('div', null,
                  React.createElement('div', { className: "flex justify-between items-center mb-1" },
                    React.createElement('h5', { className: "text-sm font-semibold text-gray-100" }, "Câu lệnh (Prompt):"),
                    React.createElement('button', { 
                      onClick: () => handleCopyPrompt(JSON.stringify(scene.prompt, null, 2), scene.scene), 
                      className: "bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-2 text-[10px] rounded flex-shrink-0",
                      'aria-label': `Copy prompt for scene ${scene.scene}`,
                      children: copiedScene === scene.scene ? 'Đã chép!' : 'Sao chép'
                    })
                  ),
                   React.createElement('div', { className: "bg-slate-900 rounded-md font-mono text-xs text-yellow-300" },
                    React.createElement('pre', { className: "whitespace-pre-wrap break-words p-2" }, JSON.stringify(scene.prompt, null, 2))
                   )
                )
              )
            ))
          )
        )
      )
    )
  );
};

export default PromptJsonApp;


import React, { useState, useCallback } from 'react';

// --- TYPES ---
interface Part {
  partNumber: number;
  voiceContent: string;
  prompts: string[];
}
interface GeneratedContent {
  parts: Part[];
}

// --- COMPONENTS ---
const Loader = (): React.ReactElement => {
  return (
    React.createElement("div", { className: "flex items-center justify-center p-4" },
      React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }),
      React.createElement("p", { className: "ml-3 text-gray-300" }, "AI đang viết kịch bản...")
    )
  );
};

const ResultPartCard = ({ part }: { part: Part }): React.ReactElement => {
  const [voiceCopied, setVoiceCopied] = useState(false);
  const [promptsCopied, setPromptsCopied] = useState(false);
  const [individualPromptCopied, setIndividualPromptCopied] = useState<number | null>(null);

  const copyToClipboard = (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const copyIndividualPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setIndividualPromptCopied(index);
      setTimeout(() => setIndividualPromptCopied(null), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const allPromptsText = part.prompts.join('\n\n');

  return (
    React.createElement("div", { className: "bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700" },
      React.createElement("h3", { className: "text-xl font-bold text-blue-400 mb-4" }, `Phần ${part.partNumber}`),
      React.createElement("div", { className: "space-y-6" },
        React.createElement("div", null,
          React.createElement("div", { className: "flex justify-between items-center mb-2" },
            React.createElement("h4", { className: "font-semibold text-lg text-indigo-300" }, "Nội dung Voice"),
            React.createElement("button", {
              onClick: () => copyToClipboard(part.voiceContent, setVoiceCopied),
              className: "px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none disabled:bg-green-600",
              disabled: voiceCopied
            }, voiceCopied ? 'Đã sao chép!' : 'Sao chép')
          ),
          React.createElement("div", { className: "bg-gray-700 p-3 rounded-md border border-gray-600" },
            React.createElement("p", { className: "text-gray-200 text-sm whitespace-pre-wrap" }, part.voiceContent)
          )
        ),
        React.createElement("div", null,
           React.createElement("div", { className: "flex justify-between items-center mb-2" },
            React.createElement("h4", { className: "font-semibold text-lg text-indigo-300" }, "Prompts Video (VEO 3.1)"),
            React.createElement("button", {
              onClick: () => copyToClipboard(allPromptsText, setPromptsCopied),
              className: "px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none disabled:bg-green-600",
              disabled: promptsCopied
            }, promptsCopied ? 'Đã sao chép!' : 'Sao chép toàn bộ')
           ),
          React.createElement("div", { className: "bg-gray-700 p-3 rounded-md border border-gray-600 max-h-60 overflow-y-auto space-y-2" },
             part.prompts.map((prompt, index) => (
               React.createElement("div", { key: index, className: "flex justify-between items-center border-b border-gray-600/50 py-2 last:border-b-0" },
                  React.createElement("p", { className: "text-gray-200 text-xs pr-4" }, prompt),
                  React.createElement("button", {
                    onClick: () => copyIndividualPrompt(prompt, index),
                    className: "px-3 py-1 text-xs rounded-md transition-colors duration-200 flex-shrink-0 " + (individualPromptCopied === index ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'),
                    disabled: individualPromptCopied === index
                  }, individualPromptCopied === index ? 'Đã chép!' : 'Chép')
               )
             ))
          )
        )
      )
    )
  );
};


const cinematicStyles = [
  "Hiện đại", "Điện ảnh", "Viễn tưởng", "Tiền sử", "Giả thuyết", "Hài hước"
];

// --- APP COMPONENT ---
const AutoPromptApp = ({ geminiApiKey, openaiApiKey, openRouterApiKey }: { geminiApiKey: string, openaiApiKey: string, openRouterApiKey: string }): React.ReactElement => {
  const [videoIdea, setVideoIdea] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedCinematicStyle, setSelectedCinematicStyle] = useState('Hiện đại');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScript = useCallback(async (
    videoIdea: string,
    durationInMinutes: number,
    cinematicStyle: string
  ): Promise<GeneratedContent> => {
    
    const totalScenes = Math.ceil((durationInMinutes * 60) / 8);
    const isLongVideo = durationInMinutes >= 5;
    const partsToGenerate = isLongVideo ? Math.ceil(durationInMinutes / 3) : 1;
    const scenesPerPart = Math.ceil(totalScenes / partsToGenerate);

    const commonPrompt = `
You are a world-class creative director and video scriptwriter for viral short-form and long-form videos. Your task is to transform a user's idea into a complete production package containing both a voiceover script and a series of video generation prompts for a model like VEO 3.1.

**CREATIVITY MANDATE:** Your outputs must exhibit a high degree of creativity and uniqueness. For every new request, even if the user provides the exact same idea as before, you are REQUIRED to generate a completely new and different story, a unique voiceover script, and a fresh sequence of prompts. Repetitive or formulaic responses are not acceptable. Your goal is to surprise the user with your originality on every single run.

**CRITICAL RULE: THEMATIC CONSISTENCY**
You MUST strictly adhere to the user-selected "Cinematic Style": "${cinematicStyle}". All elements in the voiceover and video prompts (setting, actions, mood, objects) must be thematically appropriate for this style. For example, if the style is 'Prehistoric', you MUST NOT include modern technology. This is a non-negotiable rule.

**HYPOTHETICAL SCENARIO ("Giả thuyết") PROTOCOL:**
If the selected "Cinematic Style" is "Giả thuyết" (Hypothetical), your primary task is to deeply analyze the user's "what if" premise. You must build a logical and creative world based on the direct consequences of that premise.
- Example 1: If the idea is "What if humans never had the internet?" and the style is "Modern", your world MUST NOT contain smartphones, social media, online banking, streaming services, or any technology that relies on internet connectivity. All scenes must reflect a modern world that developed without this technology.
- Example 2: If the idea is "What if there was no sunlight?", you MUST NOT generate any scenes depicting daytime, blue skies, or natural sunlight. The world should be perpetually dark or lit by alternative, non-solar sources (bioluminescence, fire, artificial lights).
This logical adherence to the premise is paramount for the "Giả thuyết" style.

**GENERAL THEMATIC ADHERENCE (ALL STYLES):**
This principle of strict adherence applies to ALL cinematic styles. You must constantly ask: "Does this object, action, or setting make logical sense within the established rules of this world (based on style and idea)?" If the answer is no, you must not include it.

**Your Task:**
Generate a JSON object containing a 'parts' array. The array will consist of the main story part(s) followed by a final interaction part.

**PART 1: MAIN STORY**
${isLongVideo
  ? `- The video is long, so you MUST divide the story into ${partsToGenerate} distinct parts.`
  : `- The video is short, so you will generate only ONE part for the entire story.`
}

For each story part, generate an object with "partNumber", "voiceContent", and "prompts".
1.  **partNumber**: The sequential number of the part, starting from 1.
2.  **voiceContent**:
    - Write a compelling and natural-sounding voiceover script in VIETNAMESE.
    - The script should tell the story. Occasionally and naturally, pose questions to the audience to stimulate their thoughts and encourage comments.
    - **LENGTH REQUIREMENT**: The voiceover for each part MUST be approximately 3400 characters long to fit the video duration.
3.  **prompts**:
    - Create a series of detailed, cinematic video prompts in ENGLISH. You MUST generate exactly ${scenesPerPart} prompts for this part.
    - **Prompt Content Rules**:
        a. **NO DIALOGUE**: Prompts MUST describe visuals and AMBIENT/ENVIRONMENTAL SOUNDS ONLY (e.g., "wind howling", "footsteps on gravel", "distant city hum"). They MUST NOT contain any character dialogue or speech.
        b. **Content Focus**: Focus on actions, emotions, facial expressions, detailed settings, and dynamic camera movements.
        c. **Visual Continuity**: Ensure settings that appear across multiple prompts are described consistently.

**PART 2: FINAL INTERACTION (MANDATORY)**
After generating all the main story parts, you MUST append ONE FINAL part to the 'parts' array. This part is a dedicated call-to-action.
-   **partNumber**: Continue the sequence (e.g., if the last story part was ${partsToGenerate}, this will be ${partsToGenerate + 1}).
-   **voiceContent**: A short VIETNAMESE script (40-60 words) that directly addresses the audience. It should reflect on the story/topic and ask engaging questions to encourage them to Like, Share, and Comment with their thoughts, feelings, or opinions on the subject.
-   **prompts**: Exactly TWO ENGLISH prompts suitable for a video outro. They should be visually engaging but not part of the main story (e.g., "an abstract animation of swirling particles related to the video's theme", "a beautifully rendered thematic background with a subtle pulsing light").
`;

    const userPrompt = `
- Idea: "${videoIdea}"
- Cinematic Style: "${cinematicStyle}"
- Total Duration: Approximately ${durationInMinutes} minutes.
`;
    const systemPrompt = `${commonPrompt}\n\nGenerate the final output as a single valid JSON object with a 'parts' array.`;

    let finalError: unknown;

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
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenRouter API failed');
            const data = await response.json();
            const jsonText = data.choices[0].message.content;
            const parsed = JSON.parse(jsonText);
            if (parsed.parts) return parsed;
        } catch (e) {
            console.warn("OpenRouter failed, trying Gemini...", e);
            finalError = e;
        }
    }

    // 2. Try Gemini
    if (geminiApiKey) {
        try {
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            const schema = {
                type: window.GenAIType.OBJECT,
                properties: {
                    parts: {
                        type: window.GenAIType.ARRAY,
                        items: {
                            type: window.GenAIType.OBJECT,
                            properties: {
                                partNumber: { type: window.GenAIType.INTEGER },
                                voiceContent: { type: window.GenAIType.STRING },
                                prompts: {
                                    type: window.GenAIType.ARRAY,
                                    items: { type: window.GenAIType.STRING },
                                }
                            },
                            required: ["partNumber", "voiceContent", "prompts"]
                        }
                    }
                },
                required: ["parts"]
            };

            const response = await ai.models.generateContent({
              model: "gemini-2.5-pro",
              contents: `${commonPrompt}\n\n**User Input:**\n${userPrompt}\n\nGenerate the final output as a single JSON object.`,
              config: {
                responseMimeType: "application/json",
                responseSchema: schema,
              },
            });
            const jsonStr = response.text.trim();
            return JSON.parse(jsonStr) as GeneratedContent;
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
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenAI failed');
            const data = await response.json();
            const jsonText = data.choices[0].message.content;
            return JSON.parse(jsonText) as GeneratedContent;
        } catch (e) {
            console.warn("OpenAI failed", e);
            finalError = e;
        }
    }

    throw finalError || new Error("Không thể tạo kịch bản. Vui lòng thử lại.");

  }, [geminiApiKey, openaiApiKey, openRouterApiKey]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedContent(null);

    const durationNum = parseFloat(duration);

    if (isNaN(durationNum) || durationNum <= 0) {
      setError("Thời lượng video phải là một số dương.");
      setLoading(false);
      return;
    }

    try {
      const content = await generateScript(videoIdea, durationNum, selectedCinematicStyle);
      setGeneratedContent(content);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo kịch bản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [videoIdea, duration, selectedCinematicStyle, generateScript]);

  const handleDownloadAllPrompts = () => {
    if (!generatedContent || !generatedContent.parts || generatedContent.parts.length === 0) return;

    const content = generatedContent.parts.map(part => 
      `--- PHẦN ${part.partNumber} ---\n\n${part.prompts.join('\n\n')}`
    ).join('\n\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'veo_prompts_full.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadAllVoiceContent = () => {
    if (!generatedContent || !generatedContent.parts || generatedContent.parts.length === 0) return;

    const content = generatedContent.parts.map(part => 
      `--- PHẦN ${part.partNumber} ---\n\n${part.voiceContent}`
    ).join('\n\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'voice_content.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                  placeholder: "Ví dụ: Một phi hành gia bị lạc trên một hành tinh xa lạ và phải tìm cách sinh tồn...",
                  value: videoIdea,
                  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setVideoIdea(e.target.value),
                  required: true
                })
              ),
              React.createElement("div", { className: "mb-6" },
                React.createElement("label", { htmlFor: "totalDuration", className: "block text-gray-200 text-sm font-bold mb-2" }, "Tổng thời lượng video:"),
                React.createElement("div", { className: "flex items-center" },
                  React.createElement("input", {
                    type: "number", id: "totalDuration",
                    className: "shadow appearance-none border border-gray-600 rounded-l w-full py-3 px-4 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    placeholder: "Ví dụ: 3", min: "0.2", step: "any", value: duration,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value),
                    required: true
                  }),
                  React.createElement("span", { className: "inline-flex items-center px-4 py-3 border border-l-0 border-gray-600 rounded-r bg-gray-700 text-gray-100 text-sm"}, "Phút")
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
              }, loading ? 'Đang tạo...' : 'Tạo Kịch Bản & Voice')
            )
          ),
          // Right Column
          React.createElement("div", { className: "md:w-3/5 lg:w-2/3 md:h-[calc(100vh-150px)] md:overflow-y-auto custom-scrollbar md:pr-4" },
            loading && React.createElement(Loader, null),
            error && React.createElement("div", { className: "bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-8", role: "alert" },
              React.createElement("strong", { className: "font-bold" }, "Lỗi!"),
              React.createElement("span", { className: "block sm:inline ml-2" }, error)
            ),
            generatedContent && generatedContent.parts && (
              React.createElement("div", null,
                React.createElement("div", { className: "flex flex-col sm:flex-row justify-center gap-4 mb-8" },
                  React.createElement("button", { onClick: handleDownloadAllVoiceContent, className: "flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors duration-200", disabled: loading }, "Tải xuống tất cả Voice (.txt)"),
                  React.createElement("button", { onClick: handleDownloadAllPrompts, className: "flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors duration-200", disabled: loading }, "Tải xuống tất cả Prompts (.txt)")
                ),
                React.createElement("div", { className: "space-y-8" },
                  generatedContent.parts.map((part, index) => React.createElement(ResultPartCard, { key: index, part: part }))
                )
              )
            )
          )
        )
    )
  );
};

export default AutoPromptApp;
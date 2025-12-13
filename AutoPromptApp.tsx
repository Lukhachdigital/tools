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

  const allPromptsText = part.prompts.join('\n\n\n');

  return (
    React.createElement("div", { className: "bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 mb-6" },
      React.createElement("h3", { className: "text-xl font-bold text-blue-400 mb-4" }, `Phần ${part.partNumber}`),
      
      React.createElement("div", { className: "mb-6" },
        React.createElement("div", { className: "flex justify-between items-center mb-2" },
            React.createElement("h4", { className: "font-semibold text-lg text-gray-200" }, "Nội dung Voice (Lời bình):"),
            React.createElement("button", {
                onClick: () => copyToClipboard(part.voiceContent, setVoiceCopied),
                className: `px-3 py-1 text-xs font-bold rounded transition-colors ${voiceCopied ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`
            }, voiceCopied ? "Đã sao chép" : "Sao chép Voice")
        ),
        React.createElement("div", { className: "bg-gray-700/50 p-4 rounded border border-gray-600 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap" },
            part.voiceContent
        )
      ),

      React.createElement("div", null,
        React.createElement("div", { className: "flex justify-between items-center mb-2" },
            React.createElement("h4", { className: "font-semibold text-lg text-gray-200" }, "Prompts (VEO 3.1):"),
            React.createElement("button", {
                onClick: () => copyToClipboard(allPromptsText, setPromptsCopied),
                className: `px-3 py-1 text-xs font-bold rounded transition-colors ${promptsCopied ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`
            }, promptsCopied ? "Đã sao chép tất cả prompts" : "Sao chép tất cả prompts")
        ),
        React.createElement("div", { className: "space-y-3" },
            part.prompts.map((prompt, idx) => (
                React.createElement("div", { key: idx, className: "relative bg-gray-900 p-3 rounded border border-gray-700 group" },
                    React.createElement("p", { className: "text-gray-400 text-xs pr-16 font-mono" }, prompt),
                    React.createElement("button", {
                        onClick: () => copyIndividualPrompt(prompt, idx),
                        className: `absolute top-2 right-2 px-2 py-1 text-[10px] font-bold rounded transition-colors opacity-0 group-hover:opacity-100 ${individualPromptCopied === idx ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`
                    }, individualPromptCopied === idx ? "Đã chép" : "Sao chép")
                )
            ))
        )
      )
    )
  );
};

// --- APP COMPONENT ---
const AutoPromptApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }) => {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState('');
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateContent = useCallback(async () => {
        if (!geminiApiKey && !openaiApiKey) {
            setError("Vui lòng cài đặt ít nhất một API Key.");
            return;
        }
        if (!topic) {
            setError("Vui lòng nhập chủ đề video.");
            return;
        }

        setLoading(true);
        setError(null);
        setParts([]);

        const systemPrompt = `You are an expert AI video scriptwriter and prompt engineer for VEO 3.1.
        Your task is to create a video script based on a topic and duration.
        The script must be divided into parts (scenes/sections).

        **CREATIVITY MANDATE:** For every new request, you MUST generate a completely new story, unique characters, and a fresh sequence of prompts. Repetitive or formulaic responses are not acceptable.

        For each part, you must provide:
        1. 'voiceContent': The voiceover text in VIETNAMESE. It must be engaging, natural, and fit the video rhythm.
        2. 'prompts': An array of video generation prompts in ENGLISH for VEO 3.1 to visualize the voiceover content.
           - Each prompt usually covers 5-8 seconds of video.
           - Prompts must follow VEO 3.1 style: Cinematic, photorealistic, 8k, high detail. Describe camera movement, lighting, subject action.
           - Do NOT include "Scene Title" or "Dialog" fields in the prompt string, just the visual description. 

        Output strictly valid JSON with this structure:
        {
          "parts": [
            {
              "partNumber": 1,
              "voiceContent": "...",
              "prompts": ["...", "..."]
            }
          ]
        }
        `;

        const userPrompt = `Topic: "${topic}".\nTotal Duration: ${duration || "Not specified"} minutes.\nCreate a script divided into logical parts.`;

        let generatedData: GeneratedContent | null = null;
        let finalError: any = null;

        // 1. Try Gemini (Priority)
        if ((selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
            try {
                if (!geminiApiKey) throw new Error("Gemini API Key chưa được cấu hình.");
                const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
                const result = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: systemPrompt + "\n\n" + userPrompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: window.GenAIType.OBJECT,
                            properties: {
                                parts: {
                                    type: window.GenAIType.ARRAY,
                                    items: {
                                        type: window.GenAIType.OBJECT,
                                        properties: {
                                            partNumber: { type: window.GenAIType.INTEGER },
                                            voiceContent: { type: window.GenAIType.STRING },
                                            prompts: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } }
                                        },
                                        required: ['partNumber', 'voiceContent', 'prompts']
                                    }
                                }
                            }
                        }
                    }
                });
                generatedData = JSON.parse(result.text);
            } catch (e) {
                console.error("Gemini failed", e);
                if (selectedAIModel === 'gemini') finalError = e;
                else finalError = e;
            }
        }

        // 2. Try OpenAI (Fallback)
        if (!generatedData && (selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
            try {
                if (!openaiApiKey) throw new Error("OpenAI API Key chưa được cấu hình.");
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
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
                generatedData = JSON.parse(data.choices[0].message.content);
            } catch (e) {
                console.error("OpenAI failed", e);
                if (selectedAIModel === 'openai') finalError = e;
                else finalError = e; // Store for fallback
            }
        }

        if (generatedData) {
            setParts(generatedData.parts);
        } else {
            setError("Không thể tạo nội dung. " + (finalError?.message || "Tất cả API đều thất bại."));
        }
        setLoading(false);

    }, [topic, duration, geminiApiKey, openaiApiKey, selectedAIModel]);

    return (
        React.createElement("div", { className: "w-full h-full p-4" },
            React.createElement("div", { className: "flex flex-col lg:flex-row gap-8" },
                React.createElement("div", { className: "lg:w-1/3 space-y-6" },
                    React.createElement("div", { className: "bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg" },
                        React.createElement("h2", { className: "text-xl font-bold text-white mb-4" }, "Nhập thông tin"),
                        React.createElement("div", { className: "space-y-4" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Chủ đề Video"),
                                React.createElement("textarea", {
                                    value: topic,
                                    onChange: (e) => setTopic(e.target.value),
                                    className: "w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white h-32 focus:ring-2 focus:ring-blue-500 transition-colors",
                                    placeholder: "Ví dụ: Lịch sử hình thành Trái Đất..."
                                } as any)
                            ),
                            React.createElement("div", null,
                                React.createElement("label", { className: "block text-sm font-medium text-gray-300 mb-1" }, "Thời lượng (Phút)"),
                                React.createElement("input", {
                                    type: "number",
                                    value: duration,
                                    onChange: (e) => setDuration(e.target.value),
                                    className: "w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 transition-colors",
                                    placeholder: "Ví dụ: 3"
                                } as any)
                            ),
                            React.createElement("button", {
                                onClick: generateContent,
                                disabled: loading,
                                className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            }, loading ? 'Đang tạo...' : 'Tạo Kịch bản & Prompt')
                        )
                    )
                ),

                React.createElement("div", { className: "lg:w-2/3" },
                    loading && React.createElement(Loader),
                    error && React.createElement("div", { className: "bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6" }, error),
                    !loading && parts.length > 0 && (
                        React.createElement("div", { className: "space-y-6 h-[calc(100vh-150px)] overflow-y-auto custom-scrollbar pr-2" },
                            parts.map((part, index) => (
                                React.createElement(ResultPartCard, { key: index, part: part })
                            ))
                        )
                    ),
                    !loading && !error && parts.length === 0 && (
                        React.createElement("div", { className: "flex flex-col items-center justify-center h-full text-gray-500 border-2 border-dashed border-gray-700 rounded-xl p-10" },
                            React.createElement("p", { className: "text-lg" }, "Kết quả sẽ hiển thị ở đây")
                        )
                    )
                )
            )
        )
    );
};

export default AutoPromptApp;
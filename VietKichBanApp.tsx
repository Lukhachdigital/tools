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


// --- COMPONENTS ---
const Loader = (): React.ReactElement => {
  return (
    React.createElement("div", { className: "flex items-center justify-center p-4" },
      React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }),
      React.createElement("p", { className: "ml-3 text-gray-300" }, "AI đang viết kịch bản...")
    )
  );
};

const CharacterCard = ({ character }: { character: Character }): React.ReactElement => {
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
    React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-lg border border-gray-700" },
       React.createElement("div", { className: "flex items-center gap-3 mb-2" },
        React.createElement("h4", { className: "text-lg font-bold text-gray-100" }, character.name),
        React.createElement("span", {
            className: `text-xs font-semibold px-2.5 py-1 rounded-full ${character.role === 'Nhân vật chính' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-600/50 text-gray-300'}`
        }, character.role)
      ),
      React.createElement("p", { className: "text-gray-300 text-sm" }, character.description),
      React.createElement("div", { className: "mt-4" },
        React.createElement("p", { className: "font-semibold text-sm text-indigo-300 mb-2" }, "Prompt tạo ảnh nhân vật (Whisk AI):"),
        React.createElement("div", { className: "relative bg-gray-700 p-3 rounded-md border border-gray-600" },
          React.createElement("p", { className: "text-gray-200 text-xs break-words pr-24" }, character.whiskPrompt),
          React.createElement("button", {
            onClick: () => copyToClipboard(character.whiskPrompt),
            className: "absolute top-2 right-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none disabled:bg-green-600",
            disabled: copied
          }, copied ? 'Đã sao chép!' : 'Sao chép')
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
      React.createElement("p", { className: "text-gray-200 text-sm break-words pr-24" }, prompt),
      React.createElement("button", {
        onClick: () => copyToClipboard(prompt),
        className: "absolute top-2 right-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-green-600",
        disabled: copied
      }, copied ? 'Đã sao chép!' : 'Sao chép')
    )
  );
};

const cinematicStyles = [
  "Hiện đại", "Điện ảnh", "Viễn tưởng", "Tiền sử", "Hoạt hình", "Hài hước"
];

// --- APP COMPONENT ---
const VietKichBanApp = ({ apiKey }: { apiKey: string }): React.ReactElement => {
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
    if (!apiKey) {
      throw new Error("API Key chưa được cấu hình.");
    }
    const ai = new window.GoogleGenAI({ apiKey });
    
    const numberOfScenes = Math.ceil((durationInMinutes * 60) / 8);

    const whiskStyleInstruction = cinematicStyle === "Hoạt hình"
      ? "The style MUST be animated."
      : "The style MUST be photorealistic and NOT animated.";

    const prompt = `
You are an expert Hollywood screenwriter and director, tasked with creating a concept for an epic, profound, and thrilling film. Your primary goal is to ensure thematic and visual consistency throughout the entire script.

**CREATIVITY MANDATE:** For every generation, even if the user input is identical to a previous one, you MUST generate a completely unique and different story, set of characters (including names), and prompts. Do not repeat previous outputs. Your creativity and originality are paramount.

**CRITICAL RULE: THEMATIC CONSISTENCY**
You MUST strictly adhere to the user-selected "Cinematic Style". Analyze it deeply. If the style is "${cinematicStyle}", all characters, actions, settings, and objects in both the character descriptions and the VEO prompts MUST be appropriate for that era and genre. For example, if the user's idea is 'a forest man saving animals' and the style is 'prehistoric', you absolutely CANNOT include modern items like cameras, walkie-talkies, or guns. This rule is non-negotiable and takes precedence over all other creative instructions.

Based on the user's idea and your strict adherence to the cinematic style, you must perform two tasks and return the result as a single JSON object.

**User Input:**
- Idea: "${videoIdea}"
- Cinematic Style: "${cinematicStyle}"
- Total Duration: Approximately ${durationInMinutes} minutes.

**Task 1: Character Development & Whisk Prompts**
- Create a list of all characters for the story, identifying main and supporting roles.
- For each character, you will create an object with four fields:
    1.  **name**: The character's name. It must be thematically appropriate for the cinematic style.
    2.  **role**: The character's role in the story. MUST be either 'Nhân vật chính' or 'Nhân vật phụ'.
    3.  **description**: A detailed description of the character in VIETNAMESE. Describe what/who they are, their appearance, and key traits (e.g., "Manu: Một con sói đầu đàn dũng mãnh, có bộ lông màu vàng óng và một vết sẹo dài trên mắt phải.").
    4.  **whiskPrompt**: A detailed, cinematic prompt in ENGLISH for Whisk AI to generate a standalone portrait of this character.
        **CRITICAL Whisk Prompt Rules:**
        a. **Style**: ${whiskStyleInstruction}
        b. **Background**: The background MUST be a 'solid white background'. This is a strict, non-negotiable requirement.
        c. **Content**: The prompt MUST NOT include the character's name. Instead, it must contain a highly detailed and evocative description of the character's physical appearance, clothing, posture, and emotions, consistent with your Vietnamese description.

**Task 2: Prompt Generation for VEO 3.1**
- You must generate exactly ${numberOfScenes} prompts, as each prompt corresponds to an 8-second video scene.
- For each scene, write one detailed, cinematic prompt in ENGLISH.
- **CRITICAL VEO PROMPT RULES:**
    1.  **Character Naming:** Every single prompt MUST explicitly mention at least one character by the 'name' you created in Task 1. A maximum of THREE named characters can be mentioned in a single prompt. It is absolutely critical that the spelling of the names is 100% accurate. This is a non-negotiable rule.
    2.  **Content Focus:** Do NOT describe clothing or outfits. Focus exclusively on character actions, the setting/background, character emotions, and facial expressions.
    3.  **DETAILED & CONSISTENT SETTINGS:** Before you write the prompts, you must internally plan the key locations. If a specific location (e.g., "the ancient, vine-covered temple entrance," "the neon-lit cyberpunk cockpit") appears in multiple scenes, you MUST use a consistent and IDENTICAL detailed description for that background in each relevant prompt to ensure visual continuity. Be very specific about the elements that make up the setting.
    4.  **Language:** All prompts MUST be in ENGLISH.
    5.  **Cinematic Style**: Each prompt must also incorporate descriptive words that reflect the chosen '${cinematicStyle}' style. For example, if the style is 'Viễn tưởng' (Sci-Fi), use terms like 'holographic glow', 'sleek metallic surfaces', 'cybernetic implants'.

Generate a JSON object that strictly adheres to the provided schema.
`;

    const schema = {
        type: window.GenAIType.OBJECT,
        properties: {
            characterList: {
                type: window.GenAIType.ARRAY,
                description: "A list of character objects, distinguishing between main and supporting roles.",
                items: {
                    type: window.GenAIType.OBJECT,
                    properties: {
                        name: { 
                            type: window.GenAIType.STRING,
                            description: "The character's name."
                        },
                        role: { 
                            type: window.GenAIType.STRING,
                            description: "The character's role, either 'Nhân vật chính' or 'Nhân vật phụ'."
                        },
                        description: { 
                            type: window.GenAIType.STRING,
                            description: "The character's detailed description in Vietnamese."
                        },
                        whiskPrompt: { 
                            type: window.GenAIType.STRING,
                            description: "A detailed English prompt for Whisk AI to generate the character's image against a solid white background."
                        }
                    },
                    required: ["name", "role", "description", "whiskPrompt"]
                }
            },
            prompts: {
                type: window.GenAIType.ARRAY,
                items: { type: window.GenAIType.STRING },
                description: `An array of exactly ${numberOfScenes} English video generation prompts for VEO 3.1.`
            }
        },
        required: ["characterList", "prompts"]
    };


    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const jsonStr = response.text.trim();
      return JSON.parse(jsonStr) as GeneratedContent;
    } catch (error) {
      console.error("Error generating script:", error);
      throw new Error("Không thể tạo kịch bản. Vui lòng thử lại.");
    }
  }, [apiKey]);

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

  const handleDownloadPrompts = () => {
    if (!generatedContent || generatedContent.prompts.length === 0) return;

    const content = generatedContent.prompts.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'veo_prompts.txt';
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
            generatedContent && (
              React.createElement("div", null,
                React.createElement("div", { className: "flex justify-center mb-8" },
                  React.createElement("button", { onClick: handleDownloadPrompts, className: "w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors duration-200", disabled: loading }, "Tải xuống Prompts (.txt)")
                ),
                React.createElement("div", { className: "bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-gray-700" },
                  React.createElement("h3", { className: "text-xl font-bold text-blue-400 mb-4" }, "Danh sách nhân vật"),
                  React.createElement("div", { className: "space-y-6" },
                    generatedContent.characterList.map((char, index) => React.createElement(CharacterCard, { key: index, character: char }))
                  )
                ),
                React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-bold text-blue-400 mb-4" }, "Prompts cho VEO 3.1"),
                    generatedContent.prompts.map((prompt, index) => React.createElement(PromptCard, { key: index, prompt: prompt, promptNumber: index + 1 }))
                )
              )
            )
          )
        )
    )
  );
};

export default VietKichBanApp;

import React, { useState, useEffect, useRef } from 'react';

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
    React.createElement('button', { className: `${baseStyles} ${buttonStyle} ${className}`, ...props },
      children
    )
  );
};

const AspectRatioSelector = ({ selectedRatio, onSelect, disabled }) => {
    const ratios = [
        { id: '16:9', label: 'Ngang' },
        { id: '9:16', label: 'Dọc' },
        { id: '1:1', label: 'Vuông' }
    ];
    return (
        React.createElement('div', { className: "flex justify-center gap-2 mb-2" },
            ratios.map(ratio => React.createElement(Button, {
                key: ratio.id,
                variant: selectedRatio === ratio.id && !disabled ? 'active' : 'secondary',
                onClick: () => onSelect(ratio.id),
                disabled: disabled,
                children: ratio.label
            }))
        )
    );
};


// =================================================================
// UI HELPERS & UTILS
// =================================================================
const Spinner = () => (
    React.createElement('svg', { className: "animate-spin h-10 w-10 text-cyan-400", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" },
        React.createElement('circle', { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
        React.createElement('path', { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
    )
);

const ErrorDisplay = ({ message }) => (
    React.createElement('div', { className: "p-2 text-center" },
        React.createElement('p', { className: "text-red-400 text-sm font-semibold" }, "Error"),
        React.createElement('p', { className: "text-xs text-red-300 mt-1" }, message)
    )
);

const parseAndEnhanceErrorMessage = (rawError) => {
    let message = rawError instanceof Error ? rawError.message : String(rawError);
    try {
        const errorJson = JSON.parse(message);
        if (errorJson.error && errorJson.error.message) {
            message = errorJson.error.message;
        }
    } catch (e) {
        // Not a JSON string
    }

    if (message.includes("API key not valid")) {
        return "API Key không hợp lệ. Vui lòng kiểm tra lại key và chắc chắn rằng nó chính xác.";
    }
    if (message.includes("accessible to billed users")) {
        return "Tính năng này yêu cầu tài khoản Google AI đã bật thanh toán. Vui lòng truy cập dự án Google Cloud của bạn để thiết lập thanh toán.";
    }
    if (message.includes("quota")) {
       return "Lỗi hạn ngạch (Quota Error). Bạn đã đạt đến giới hạn yêu cầu cho API key này. Vui lòng thử lại sau hoặc kiểm tra giới hạn của bạn trong Google AI Studio."
    }
    return message;
};

// =================================================================
// CUSTOM UI COMPONENTS for TAO ANH TREND
// =================================================================
type UploadedImage = {
  id: string;
  base64: string;
  dataUrl: string;
  mimeType: string;
};

const SingleImageUploader = ({ uploadedImage, setUploadedImage, isGenerating, placeholderText, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImage({
            id: `${file.name}-${Date.now()}`,
            base64: reader.result.split(',')[1],
            dataUrl: reader.result,
            mimeType: file.type,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
      React.createElement('div', {className: 'flex-1 flex flex-col'},
        label && React.createElement('label', { className: "block text-sm text-center font-semibold mb-2" }, label),
        React.createElement('div', { 
          className: `w-full h-32 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center transition relative group ${isGenerating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-700'}`,
          onClick: () => !isGenerating && fileInputRef.current?.click()
        },
          React.createElement('input', { 
            type: "file", 
            ref: fileInputRef, 
            className: "hidden", 
            onChange: handleFileChange, 
            accept: "image/png, image/jpeg, image/webp",
            disabled: isGenerating,
          }),
          uploadedImage ? (
            React.createElement(React.Fragment, null,
              React.createElement('img', { src: uploadedImage.dataUrl, alt: "Uploaded preview", className: "w-full h-full object-cover rounded-lg" }),
              (() => {
                const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
                    onClick: (e) => { e.stopPropagation(); setUploadedImage(null); },
                    className: "absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 leading-none shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100",
                    disabled: isGenerating,
                    'aria-label': "Remove image"
                };
                return React.createElement('button', buttonProps,
                    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3", viewBox: "0 0 20 20", fill: "currentColor" },
                        React.createElement('path', { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" })
                    )
                );
              })()
            )
          ) : (
            React.createElement('div', { className: "text-center text-gray-400 p-2" },
              React.createElement('p', null, placeholderText)
            )
          )
        )
      )
  );
};


const ImageCountSelector = ({ numberOfImages, setNumberOfImages, isGenerating }) => {
   return (
      React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-semibold mb-2" }, "Số lượng ảnh"),
          React.createElement('div', { className: "flex space-x-2" },
              [1, 2, 3, 4].map(num => (
                  React.createElement(Button, {
                      key: num,
                      variant: numberOfImages === num ? 'active' : 'secondary',
                      onClick: () => setNumberOfImages(num),
                      disabled: isGenerating,
                      className: "flex-1",
                      children: num
                  })
              ))
          )
      )
   );
};

interface Result {
  id: string;
  status: 'generating' | 'pending' | 'error' | 'done';
  error?: string;
  imageUrl?: string;
  prompt: string;
}
interface ResultsPanelProps {
  results: Result[];
}

const ResultsPanel = ({ results }: ResultsPanelProps) => {
  const isLandscape = results.length > 0 && results[0].imageUrl 
    ? (() => {
        const img = new Image();
        img.src = results[0].imageUrl;
        return img.naturalWidth > img.naturalHeight;
      })()
    : true;
    
  const gridClass = isLandscape
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
      : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4';

  return (
    React.createElement('div', { className: "bg-slate-900/50 border border-slate-700 rounded-lg p-4 min-h-[400px]" },
      results.length === 0 ? (
          React.createElement('p', { className: "text-center text-gray-500 pt-8" }, "Ảnh sẽ hiện ở đây.")
      ) : (
          React.createElement('div', { className: gridClass },
            results.map(res => (
              React.createElement('div', { key: res.id, className: "bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col" },
                  React.createElement('div', { className: "w-full aspect-video bg-slate-700 flex items-center justify-center" },
                      (res.status === 'generating' || res.status === 'pending') && React.createElement(Spinner),
                      res.status === 'error' && React.createElement(ErrorDisplay, { message: res.error || 'An unknown error occurred.' }),
                      res.status === 'done' && res.imageUrl && 
                        React.createElement('img', { src: res.imageUrl, alt: res.prompt, className: "w-full h-full object-contain" })
                  ),
                  React.createElement('div', { className: "p-3 flex-grow flex flex-col" },
                    React.createElement('p', { className: "text-xs text-gray-400 flex-grow", title: res.prompt }, res.prompt),
                    res.status === 'done' && res.imageUrl && (
                      React.createElement('a', { 
                        href: res.imageUrl, 
                        download: `anh_trend_${res.prompt.slice(0, 20).replace(/[\s/\\?%*:|"<>]/g, '_')}_${res.id}.png`, 
                        target: "_blank", 
                        rel: "noopener noreferrer"
                      },
                        React.createElement(Button, { variant: "secondary", className: "w-full mt-2 text-xs py-1", children: "Download" })
                      )
                    )
                  )
              )
            ))
          )
      ))
  );
};


// =================================================================
// MAIN COMPONENT LOGIC
// =================================================================
const TrendImageGeneratorTab = ({ geminiApiKey, openaiApiKey, selectedAIModel }) => {
  const [theme, setTheme] = useState('');
  const [creativeNotes, setCreativeNotes] = useState('');
  const [results, setResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [characterImage1, setCharacterImage1] = useState<UploadedImage | null>(null);
  const [characterImage2, setCharacterImage2] = useState<UploadedImage | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const isGpt = selectedAIModel === 'gpt';

  const generateImage = async (taskTheme, index) => {
     setResults(prev => prev.map((res, idx) => idx === index ? { ...res, status: 'generating' } : res));

     try {
        if (selectedAIModel === 'gemini') {
            if (!geminiApiKey) {
                throw new Error("API Key Gemini chưa được cấu hình.");
            }
            const uploadedImages = [characterImage1, characterImage2].filter(Boolean);
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });

            if (uploadedImages.length > 0) {
                const parts = [];
                const finalPrompt = `
                    **MISSION: CREATIVE GROUP PORTRAIT**
                    Your mission is to generate a single, high-resolution, photorealistic group portrait.

                    **[CORE TASK & NON-NEGOTIABLE RULES]**
                    1.  **COMBINE CHARACTERS:** You are provided with ${uploadedImages.length} separate image(s), each featuring one person. Your primary task is to create a SINGLE, new, cohesive image that includes ALL ${uploadedImages.length} of these individuals together.
                    2.  **ASPECT RATIO:** The final image's aspect ratio MUST be determined by the aspect ratio of the FIRST uploaded character image. This is a critical instruction for visual consistency.
                    3.  **FACIAL IDENTITY (ABSOLUTE PRIORITY):** The face, features, and identity of EACH person from the uploaded photos MUST be preserved with 100% accuracy. This is the most critical instruction. Do not alter their faces.
                    4.  **THEME & SETTING:** The entire scene, including the background, clothing, and atmosphere, must be creatively reimagined based on the user's theme: "${taskTheme}".
                    5.  **USER GUIDANCE:** Incorporate these creative notes from the user: "${creativeNotes.trim() ? creativeNotes : 'Use expert art direction for a visually stunning and creative image.'}"
                    6.  **NO TEXT:** The final image must NOT contain any text, letters, or numbers. This is a strict rule.
                    7.  **PHOTOREALISM:** The final image should be photorealistic and high-quality. Avoid cartoon or animated styles unless specifically requested in the theme or creative notes.

                    **FINAL MANDATORY CHECKLIST:**
                    1.  **CHARACTERS:** Does the image contain all ${uploadedImages.length} people and are their faces recognizable? -> If not, FAIL.
                    2.  **THEME:** Does the scene match the theme? -> If not, FAIL.
                    3.  **TEXT:** Is there absolutely NO TEXT on the image? -> If not, FAIL.
                `;
                
                parts.push({ text: finalPrompt });
                uploadedImages.forEach(img => {
                    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
                });
                const apiContents = { parts };
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: apiContents,
                    config: { responseModalities: [window.GenAIModality.IMAGE] },
                });
                const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (!imagePart || !imagePart.inlineData) {
                    throw new Error('Image generation succeeded, but no image data was returned.');
                }
                const base64ImageBytes = imagePart.inlineData.data;
                const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
                setResults(prev => prev.map((res, idx) => idx === index ? { ...res, status: 'done', imageUrl: imageUrl } : res));
            } else {
                const finalImagenPrompt = `
                  **MISSION: Create ONE viral-quality image (VISUALS ONLY).**
                  **[DESIGN & STYLE REQUIREMENTS]**
                  *   **VISUAL THEME:** The entire image's concept and style must creatively and powerfully represent the topic: "${taskTheme}". **DO NOT RENDER ANY TEXT ON THE IMAGE.**
                  *   **STYLE:** Vibrant, high-contrast, professional, and extremely eye-catching. Use modern graphic design principles.
                  *   **USER GUIDANCE:** ${creativeNotes.trim() ? creativeNotes : 'Use expert art direction for a highly creative image.'}
                  ---
                  **FINAL GOAL:** A visually stunning image that represents the theme perfectly, with absolutely NO TEXT.
                `;
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: finalImagenPrompt,
                    config: {
                      numberOfImages: 1,
                      outputMimeType: 'image/png',
                      aspectRatio: aspectRatio,
                    },
                });
                if (!response.generatedImages?.[0]?.image?.imageBytes) {
                    throw new Error('Image generation succeeded, but no image data was returned from Imagen.');
                }
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                setResults(prev => prev.map((res, idx) => 
                    idx === index ? { ...res, status: 'done', imageUrl: imageUrl } : res
                ));
            }
        } else { // OpenAI
            if (!openaiApiKey) {
                throw new Error("API Key OpenAI chưa được cấu hình.");
            }
            const uploadedImages = [characterImage1, characterImage2].filter(Boolean);
            if (uploadedImages.length > 0) {
                throw new Error("Tính năng kết hợp ảnh nhân vật chỉ được hỗ trợ bởi Gemini. Vui lòng chọn model Gemini để sử dụng.");
            }
            const finalDallePrompt = `
                **MISSION: Create ONE viral-quality image (VISUALS ONLY).**
                **[DESIGN & STYLE REQUIREMENTS]**
                *   **VISUAL THEME:** The entire image's concept and style must creatively and powerfully represent the topic: "${taskTheme}". **DO NOT RENDER ANY TEXT ON THE IMAGE.**
                *   **STYLE:** Vibrant, high-contrast, professional, and extremely eye-catching. Use modern graphic design principles.
                *   **USER GUIDANCE:** ${creativeNotes.trim() ? creativeNotes : 'Use expert art direction for a highly creative image.'}
                ---
                **FINAL GOAL:** A visually stunning image that represents the theme perfectly, with absolutely NO TEXT.
            `;
            const sizeMap = { '16:9': '1792x1024', '9:16': '1024x1792', '1:1': '1024x1024' };
            const response = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: finalDallePrompt,
                n: 1,
                size: sizeMap[aspectRatio] || '1024x1024',
                response_format: 'b64_json',
                quality: 'hd',
                style: 'vivid'
              })
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`OpenAI DALL-E Error: ${errorData.error.message}`);
            }
            const data = await response.json();
            const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
            setResults(prev => prev.map((res, idx) => 
                idx === index ? { ...res, status: 'done', imageUrl: imageUrl } : res
            ));
        }
     } catch(error) {
        const errorMessage = parseAndEnhanceErrorMessage(error);
        setResults(prev => prev.map((res, idx) => 
            idx === index ? { ...res, status: 'error', error: errorMessage } : res
        ));
     }
  };

  const handleGenerateClick = async () => {
    if (isGpt && !openaiApiKey) {
        alert('Vui lòng cài đặt API Key OpenAI trước khi tạo.');
        return;
    }
    if (!isGpt && !geminiApiKey) {
        alert('Vui lòng cài đặt API Key Gemini trước khi tạo.');
        return;
    }
    if (!characterImage1 && !theme.trim()) {
      alert('Vui lòng nhập chủ đề hoặc tải ít nhất một ảnh nhân vật.');
      return;
    }

    const tasks: Result[] = [];
    for (let i = 0; i < numberOfImages; i++) {
        tasks.push({
          id: `task-${theme.slice(0,10)}-${i}-${Date.now()}`,
          prompt: theme,
          status: 'pending'
        });
    }

    setIsGenerating(true);
    setResults(tasks);

    for (let i = 0; i < tasks.length; i++) {
        await generateImage(tasks[i].prompt, i);
    }

    setIsGenerating(false);
  };
  
  const totalImages = (characterImage1 || theme.trim()) ? numberOfImages : 0;
  const canGenerate = isGenerating || (!characterImage1 && !theme.trim());

  const themeTextAreaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
    id: "theme-textarea",
    className: "w-full h-32 bg-slate-800 text-white border border-slate-600 rounded-md p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
    placeholder: "Ví dụ: Ngày tết, Trung thu, Cảnh chùa...",
    value: theme,
    onChange: (e) => setTheme(e.target.value),
    disabled: isGenerating
  };
  const creativeNotesTextAreaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
    id: "creative-notes-textarea",
    className: "w-full h-24 bg-slate-800 text-white border border-slate-600 rounded-md p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
    placeholder: "VD: Đội nón lá, cầm hoa sen, tone màu vàng...",
    value: creativeNotes,
    onChange: (e) => setCreativeNotes(e.target.value),
    disabled: isGenerating
  };

  return (
    React.createElement('div', { className: "flex flex-col lg:flex-row gap-8" },
      React.createElement('div', { className: "lg:w-2/5 xl:w-1/3 flex-shrink-0 space-y-8" },
        React.createElement('div', null,
          React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "1. Tùy chỉnh"),
          React.createElement('div', { className: "bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4" },
              React.createElement('div', null,
                  React.createElement('label', { className: "block text-sm font-semibold mb-2" }, "Upload ảnh nhân vật"),
                  isGpt && React.createElement('p', { className: "text-xs text-center text-yellow-400 p-2 bg-yellow-900/50 rounded-md mb-2" }, "Tính năng upload và kết hợp ảnh chỉ hỗ trợ model Gemini."),
                  React.createElement(AspectRatioSelector, {
                      selectedRatio: aspectRatio,
                      onSelect: setAspectRatio,
                      disabled: !!(characterImage1 || characterImage2)
                  }),
                  React.createElement('p', { className: "text-xs text-center text-slate-400 mb-2" }, "Bạn Upload ảnh mẫu tỷ lệ nào, ảnh kết quả sẽ là tỷ lệ tương tự"),
                  React.createElement('div', { className: "flex gap-4" },
                      React.createElement(SingleImageUploader, { 
                          label: "Nhân vật 1",
                          uploadedImage: characterImage1, 
                          setUploadedImage: setCharacterImage1, 
                          isGenerating: isGenerating || isGpt, 
                          placeholderText: "Upload ảnh 1"
                      }),
                      React.createElement(SingleImageUploader, { 
                          label: "Nhân vật 2",
                          uploadedImage: characterImage2, 
                          setUploadedImage: setCharacterImage2, 
                          isGenerating: isGenerating || isGpt, 
                          placeholderText: "Upload ảnh 2"
                      })
                  )
              ),
              React.createElement(ImageCountSelector, { numberOfImages, setNumberOfImages, isGenerating })
          )
        ),

        React.createElement('div', null,
          React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "2. Nhập nội dung"),
          React.createElement('div', { className: "bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4" },
              React.createElement('div', null,
                React.createElement('label', { htmlFor: "theme-textarea", className: "block text-sm font-semibold mb-1" },
                    "Chủ đề của bạn"
                ),
                React.createElement('textarea', themeTextAreaProps)
              ),
              React.createElement('div', null,
                 React.createElement('label', { htmlFor: "creative-notes-textarea", className: "block text-sm font-semibold mb-1" },
                    "Gợi ý sáng tạo (Tùy chọn)"
                ),
                React.createElement('textarea', creativeNotesTextAreaProps)
              ),
              React.createElement(Button, {
                  variant: "primary",
                  className: "w-full text-lg py-3",
                  onClick: handleGenerateClick,
                  disabled: canGenerate,
                  children: isGenerating ? 'Đang tạo...' : `Tạo ${totalImages > 0 ? totalImages : ''} ảnh`
              })
          )
        )
      ),

      React.createElement('div', { className: "lg:w-3/5 xl:w-2/3" },
         React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "3. Kết quả"),
         React.createElement(ResultsPanel, { results })
      )
    )
  );
};

const TaoAnhTrendApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }) => {
  return (
    React.createElement('div', { className: "min-h-screen w-full p-4" },
      React.createElement('main', { className: "text-gray-300 space-y-6 h-full" },
          React.createElement(TrendImageGeneratorTab, { geminiApiKey, openaiApiKey, selectedAIModel })
      )
    )
  );
};

export default TaoAnhTrendApp;
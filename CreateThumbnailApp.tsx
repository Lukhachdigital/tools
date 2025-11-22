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

// Fix: Corrected Input component props typing to resolve issues with destructuring inherited properties.
const Input = ({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; }) => {
  const baseStyles = 'w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white';
  if (label) {
    return (
      React.createElement('div', null,
        React.createElement('label', { className: "block text-sm font-semibold mb-1" }, `${label}:`),
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
// COMMON UI COMPONENTS for THUMBNAIL TAB
// =================================================================

const Lightbox = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    const handleSave = () => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `thumbnail-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // FIX: Extracted div props into typed variables to avoid TypeScript errors with React.createElement.
    const outerDivProps: React.HTMLAttributes<HTMLDivElement> = {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm",
      onClick: onClose
    };

    const innerDivProps: React.HTMLAttributes<HTMLDivElement> = {
      className: "relative w-full max-w-4xl max-h-[90vh] p-4",
      onClick: e => e.stopPropagation()
    };

    return React.createElement('div', outerDivProps,
      React.createElement('div', innerDivProps,
        React.createElement('img', {
          src: imageUrl,
          alt: "Enlarged thumbnail",
          className: "w-full h-full object-contain rounded-lg shadow-2xl",
        }),
        React.createElement('div', { className: "absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4" },
          React.createElement('button', {
            onClick: handleSave,
            className: "px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          }, "Lưu ảnh"),
          React.createElement('button', {
            onClick: onClose,
            className: "px-6 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
          }, "Đóng")
        )
      )
    );
};


type UploadedImage = {
  id: string;
  base64: string;
  dataUrl: string;
  mimeType: string;
};

const SingleImageUploader = ({ uploadedImage, setUploadedImage, isGenerating, placeholderText }) => {
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
      React.createElement('div', null,
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
                // FIX: Explicitly type button props to resolve TS error with React.createElement
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

interface Result {
  id: string;
  status: 'generating' | 'pending' | 'error' | 'done';
  error?: string;
  imageUrl?: string;
  prompt: string;
}
interface ResultsPanelProps {
  results: Result[];
  onImageClick: (url: string) => void;
}

const ResultsPanel = ({ results, onImageClick }: ResultsPanelProps) => {
  // Determine grid layout based on the first image's aspect ratio, default to grid
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
          React.createElement('p', { className: "text-center text-gray-500 pt-8" }, "Thumbnail sẽ hiện ở đây.")
      ) : (
          React.createElement('div', { className: gridClass },
            results.map(res => (
              React.createElement('div', { key: res.id, className: "bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col" },
                  React.createElement('div', { 
                      className: "w-full aspect-video bg-slate-700 flex items-center justify-center cursor-pointer",
                      onClick: () => res.status === 'done' && res.imageUrl && onImageClick(res.imageUrl)
                  },
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
                        download: `thumbnail_${res.prompt.slice(0, 20).replace(/[\s/\\?%*:|"<>]/g, '_')}_${res.id}.png`, 
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
// TAB: THUMBNAIL GENERATOR
// =================================================================
const ThumbnailGeneratorTab = ({ geminiApiKey, openaiApiKey, openRouterApiKey }) => {
  const [prompts, setPrompts] = useState('');
  const [creativeNotes, setCreativeNotes] = useState('');
  const [results, setResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [characterImage, setCharacterImage] = useState<UploadedImage | null>(null);
  const [accessoryImage, setAccessoryImage] = useState<UploadedImage | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  const generateThumbnail = async (userTextPrompt, index) => {
     setResults(prev => prev.map((res, idx) => idx === index ? { ...res, status: 'generating' } : res));

     const finalDallePrompt = `
        **MISSION: Create ONE viral-quality thumbnail (VISUALS ONLY).**
        **[DESIGN & STYLE REQUIREMENTS]**
        *   **VISUAL THEME:** The entire image's concept and style must creatively and powerfully represent the topic: "${userTextPrompt}". **DO NOT RENDER ANY TEXT ON THE IMAGE.**
        *   **STYLE:** Vibrant, high-contrast, professional, and extremely eye-catching. Use modern graphic design principles for maximum clickability.
        *   **USER GUIDANCE:** ${creativeNotes.trim() ? `**User's Creative Guidance (High Priority):** ${creativeNotes}` : ''}
        *   **COMPOSITION:** Create a dynamic and engaging composition. AVOID boring, centered layouts.
        ---
        **FINAL GOAL:** A visually stunning thumbnail that represents the theme perfectly, with absolutely NO TEXT.
    `;
    
    const sizeMap = { '16:9': '1792x1024', '9:16': '1024x1792', '1:1': '1024x1024' };

    let finalError = null;

    // 1. Try OpenRouter (if no image upload involved)
    if (openRouterApiKey && !characterImage && !accessoryImage) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openRouterApiKey}` },
              body: JSON.stringify({
                model: 'black-forest-labs/flux-1-schnell', 
                prompt: finalDallePrompt,
                n: 1,
                size: sizeMap[aspectRatio] || '1024x1024',
              })
            });
            
            if (response.ok) {
                const data = await response.json();
                const imageUrl = data.data[0].url; 
                setResults(prev => prev.map((res, idx) => idx === index ? { ...res, status: 'done', imageUrl: imageUrl } : res));
                return;
            } else {
                console.warn("OpenRouter Image Generation failed, falling back...");
            }
        } catch (e) {
            console.warn("OpenRouter Image Generation error:", e);
        }
    }

    // 2. Try Gemini (Preferred for Images or fallback)
    if (geminiApiKey) {
        try {
            const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
            
            if (characterImage) {
              const parts = [];
              const finalPrompt = `
                  **MISSION: VIRAL THUMBNAIL CREATION (VISUALS ONLY)**
                  **[ART DIRECTION & CREATIVE EXECUTION]**
                  1.  **CORE TASK:** Transform the uploaded image based on a visual theme. The person in the image is the main character, but you must reimagine everything else: pose, action, clothing, and background to create a dynamic, viral-quality scene. **DO NOT ADD ANY TEXT TO THE IMAGE.**
                  2.  **ASPECT RATIO:** The final image's aspect ratio MUST match the aspect ratio of the uploaded character image.
                  3.  **ACCESSORY INTEGRATION (If accessory image is provided):** The character MUST be wearing or using the accessory from the secondary image in a natural and visually appealing way. The accessory's design, shape, and color must be preserved with 100% fidelity.
                  4.  **THEME:** The visual theme is: "${userTextPrompt}". All visuals must powerfully represent this concept.
                  5.  **USER GUIDANCE:** ${creativeNotes.trim() ? creativeNotes : 'Use expert art direction for a highly clickable thumbnail.'}
                  6.  **FACIAL IDENTITY (NON-NEGOTIABLE):** The character's face, features, and identity MUST be preserved with 100% accuracy from the uploaded photo. This is the most critical instruction. Do not alter the face.
                  **FINAL REVIEW:** Is the person recognizable? Is the thumbnail visually compelling based on the theme? Is there absolutely NO TEXT on the image? If all answers are YES, complete the mission.
                `;
              
              parts.push({ text: finalPrompt });
              parts.push({ inlineData: { mimeType: characterImage.mimeType, data: characterImage.base64 }});
              if (accessoryImage) {
                parts.push({ inlineData: { mimeType: accessoryImage.mimeType, data: accessoryImage.base64 }});
              }
              const apiContents = { parts };
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: apiContents,
                  config: { responseModalities: [window.GenAIModality.IMAGE] },
              });
              let base64ImageBytes = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
              if (!base64ImageBytes) throw new Error('Image composition succeeded, but no image data was returned.');
              const imageUrl = `data:${response.candidates[0].content.parts[0].inlineData.mimeType};base64,${base64ImageBytes}`;
              setResults(prev => prev.map((res, idx) => idx === index ? { ...res, status: 'done', imageUrl: imageUrl } : res));
              return;
            } else {
              const creativeGuidanceForImagen = creativeNotes.trim()
                  ? `**User's Creative Guidance (High Priority):** ${creativeNotes}`
                  : '';
              const finalImagenPrompt = `
                    **MISSION: Create ONE viral-quality thumbnail (VISUALS ONLY).**
                    **[DESIGN & STYLE REQUIREMENTS]**
                    *   **VISUAL THEME:** The entire image's concept and style must creatively and powerfully represent the topic: "${userTextPrompt}". **DO NOT RENDER ANY TEXT ON THE IMAGE.**
                    *   **STYLE:** Vibrant, high-contrast, professional, and extremely eye-catching. Use modern graphic design principles for maximum clickability.
                    *   **USER GUIDANCE:** ${creativeGuidanceForImagen}
                    *   **COMPOSITION:** Create a dynamic and engaging composition. AVOID boring, centered layouts.
                    ---
                    **FINAL GOAL:** A visually stunning thumbnail that represents the theme perfectly, with absolutely NO TEXT.
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
                  throw new Error('Image generation succeeded, but no image data was returned from the specialized model.');
              }
              const base64ImageBytes = response.generatedImages[0].image.imageBytes;
              const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
              setResults(prev => prev.map((res, idx) => 
                  idx === index ? { ...res, status: 'done', imageUrl: imageUrl } : res
              ));
              return;
            }
        } catch (e) {
            console.warn("Gemini Image Generation failed:", e);
            finalError = e;
        }
    } else {
        // Specific requirement: If user uses OpenRouter fail and Gemini Key is missing -> Alert
        if (openRouterApiKey && !openaiApiKey) {
             // Assuming fallback chain: OpenRouter -> Gemini -> OpenAI
             // If we reached here, OpenRouter failed/skipped.
             // Alert user to enter Gemini key.
             alert("OpenRouter tạo ảnh thất bại. Vui lòng nhập Gemini API Key để tiếp tục.");
        }
    }

    // 3. Try OpenAI
    if (openaiApiKey) {
        try {
            if (characterImage || accessoryImage) {
                throw new Error("Tính năng giữ lại khuôn mặt và chỉnh sửa ảnh chỉ được hỗ trợ bởi Gemini. Vui lòng chọn model Gemini để sử dụng.");
            }
            
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
            return;
        } catch(e) {
            console.warn("OpenAI Image Generation failed:", e);
            finalError = e;
        }
    }

    const errorMessage = parseAndEnhanceErrorMessage(finalError || new Error("Tất cả các API đều thất bại hoặc chưa được cấu hình."));
    setResults(prev => prev.map((res, idx) => 
        idx === index ? { ...res, status: 'error', error: errorMessage } : res
    ));
  };

  const handleGenerateClick = async () => {
    if (!geminiApiKey && !openaiApiKey && !openRouterApiKey) {
      alert('Vui lòng cài đặt ít nhất một API Key (OpenRouter, Gemini, hoặc OpenAI).');
      return;
    }
    const promptList = prompts.split('\n').filter(p => p.trim() !== '');
    if (promptList.length === 0 && !characterImage) {
      alert('Vui lòng nhập mô tả nội dung hoặc tải ảnh mẫu lên.');
      return;
    }
    
    const effectivePromptList = promptList.length > 0 ? promptList : [''];

    const tasks: Result[] = [];
    effectivePromptList.forEach(prompt => {
      for (let i = 0; i < numberOfImages; i++) {
        tasks.push({
          id: `task-${prompt.slice(0,10)}-${i}-${Date.now()}`,
          prompt: prompt || 'AI-generated background',
          status: 'pending'
        });
      }
    });

    setIsGenerating(true);
    setResults(tasks);

    for (let i = 0; i < tasks.length; i++) {
        await generateThumbnail(tasks[i].prompt, i);
    }

    setIsGenerating(false);
  };
  
  const promptCount = prompts.split('\n').filter(p => p.trim() !== '').length || (characterImage ? 1 : 0);
  const totalImages = promptCount * numberOfImages;
  const canGenerate = isGenerating || (!prompts.trim() && !characterImage);

  const promptTextAreaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
    id: "prompt-textarea-image",
    className: "w-full h-32 bg-slate-800 text-white border border-slate-600 rounded-md p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
    placeholder: "Cách kiếm 100 triệu đầu tiên\nReview phim mới nhất\n...",
    value: prompts,
    onChange: (e) => setPrompts(e.target.value),
    disabled: isGenerating
  };
  const creativeNotesTextAreaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
    id: "creative-notes-textarea",
    className: "w-full h-24 bg-slate-800 text-white border border-slate-600 rounded-md p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
    placeholder: "VD: tone màu vàng, chủ thể bên trái, biểu cảm 'wow'...",
    value: creativeNotes,
    onChange: (e) => setCreativeNotes(e.target.value),
    disabled: isGenerating
  };

  return (
    React.createElement(React.Fragment, null,
      lightboxImage && React.createElement(Lightbox, { imageUrl: lightboxImage, onClose: () => setLightboxImage(null) }),
      React.createElement('div', { className: "flex flex-col lg:flex-row gap-8" },
        React.createElement('div', { className: "lg:w-2/5 xl:w-1/3 flex-shrink-0 space-y-8" },
          React.createElement('div', null,
            React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "1. Tùy chỉnh"),
            React.createElement('div', { className: "bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4" },
                React.createElement(AspectRatioSelector, {
                    selectedRatio: aspectRatio,
                    onSelect: setAspectRatio,
                    disabled: !!(characterImage || accessoryImage)
                }),
                // Only warn if NO key supports multimodal (which is Gemini-only feature currently)
                (!geminiApiKey) && React.createElement('p', { className: "text-xs text-center text-yellow-400 p-2 bg-yellow-900/50 rounded-md -my-2" }, "Tính năng upload ảnh và giữ khuôn mặt chỉ hỗ trợ model Gemini."),
                React.createElement('p', { className: "text-sm text-center text-slate-400 -mb-2" }, "Bạn Upload ảnh mẫu tỷ lệ nào, ảnh kết quả sẽ là tỷ lệ tương tự"),
                React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                  React.createElement(SingleImageUploader, { 
                      uploadedImage: characterImage, 
                      setUploadedImage: setCharacterImage, 
                      isGenerating: isGenerating, 
                      placeholderText: "Upload ảnh nhân vật"
                  }),
                  React.createElement(SingleImageUploader, { 
                      uploadedImage: accessoryImage, 
                      setUploadedImage: setAccessoryImage, 
                      isGenerating: isGenerating, 
                      placeholderText: "Upload ảnh phụ kiện"
                  })
                ),
                React.createElement(ImageCountSelector, { numberOfImages, setNumberOfImages, isGenerating })
            )
          ),

          React.createElement('div', null,
            React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "2. Nhập nội dung"),
            React.createElement('div', { className: "bg-slate-900/50 p-4 rounded-lg border border-slate-700" },
                React.createElement('label', { htmlFor: "prompt-textarea-image", className: "block text-sm font-semibold mb-1" },
                    "Mô tả nội dung ảnh Thumbnail"
                ),
                React.createElement('textarea', promptTextAreaProps),
                 React.createElement('label', { htmlFor: "creative-notes-textarea", className: "block text-sm font-semibold mb-1 mt-4" },
                    "Gợi ý sáng tạo (Tùy chọn)"
                ),
                React.createElement('textarea', creativeNotesTextAreaProps),
                React.createElement(Button, {
                    variant: "primary",
                    className: "w-full mt-4 text-lg py-3",
                    onClick: handleGenerateClick,
                    disabled: canGenerate,
                    children: isGenerating ? 'Đang tạo...' : `Tạo ${totalImages > 0 ? totalImages : ''} Thumbnail`
                })
            )
          )
        ),

        React.createElement('div', { className: "lg:w-3/5 xl:w-2/3" },
           React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "3. Kết quả"),
           React.createElement(ResultsPanel, { results, onImageClick: setLightboxImage })
        )
      )
    )
  );
};

const CreateThumbnailApp = ({ geminiApiKey, openaiApiKey, openRouterApiKey }) => {
  return (
    React.createElement('div', { className: "min-h-screen w-full p-4" },
      React.createElement('main', { className: "text-gray-300 space-y-6 h-full" },
          React.createElement(ThumbnailGeneratorTab, { geminiApiKey, openaiApiKey, openRouterApiKey })
      )
    )
  );
};

export default CreateThumbnailApp;
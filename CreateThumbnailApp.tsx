



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

type UploadedImageFile = { dataUrl: string; mimeType: string };
type CanvasImageOutput = { base64: string; mimeType: string };

const createImageOnCanvas = (imageFile: UploadedImageFile, aspectRatio: string): Promise<CanvasImageOutput> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
      const baseWidth = 1280; 
      canvas.width = baseWidth;
      canvas.height = (baseWidth / ratioW) * ratioH;
      
      ctx.fillStyle = '#1e293b'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth, drawHeight, dx, dy;

      if (imgRatio > canvasRatio) {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgRatio;
      } else {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgRatio;
      }
      
      dx = (canvas.width - drawWidth) / 2;
      dy = (canvas.height - drawHeight) / 2;

      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve({
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
      });
    };
    img.onerror = reject;
    img.src = imageFile.dataUrl;
  });
};


// =================================================================
// COMMON UI COMPONENTS for THUMBNAIL TAB
// =================================================================
const PlatformSelector = ({ platform, setPlatform, isGenerating }) => {
  const platformOptions = {
    '16:9': 'Khổ ngang 16:9',
    '1:1': 'khổ vuông 1:1',
  };
  return (
      React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-semibold mb-2" }, "Tỷ lệ ảnh"),
          React.createElement('div', { className: "flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2" },
              Object.entries(platformOptions).map(([value, label]) => (
                React.createElement(Button, {
                  key: value,
                  variant: platform === value ? 'active' : 'secondary',
                  onClick: () => setPlatform(value),
                  className: "flex-1",
                  disabled: isGenerating,
                  children: label
                })
              ))
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

const SingleImageUploader = ({ uploadedImage, setUploadedImage, isGenerating, title, helpText }) => {
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
        React.createElement('label', { className: "block text-sm font-semibold mb-2" }, title),
        React.createElement('div', { 
          className: "w-full h-32 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-700 transition relative group",
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
            React.createElement('div', { className: "text-center text-gray-400" },
              React.createElement('p', null, "Click để chọn ảnh"),
              React.createElement('p', { className: "text-xs" }, helpText)
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
  platform: string;
}

const ResultsPanel = ({ results, platform }: ResultsPanelProps) => {
  const gridClass = platform === '16:9' 
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
const ThumbnailGeneratorTab = ({ addLog, apiKey }) => {
  const [prompts, setPrompts] = useState('');
  const [creativeNotes, setCreativeNotes] = useState('');
  const [results, setResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [platform, setPlatform] = useState('16:9');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [characterImage, setCharacterImage] = useState<UploadedImage | null>(null);
  const [accessoryImage, setAccessoryImage] = useState<UploadedImage | null>(null);
  const [generationMode, setGenerationMode] = useState('accurate'); // 'accurate' or 'creative'
  const [showTextOnThumbnail, setShowTextOnThumbnail] = useState(true);
  
  const generateThumbnail = async (userTextPrompt, index) => {
     setResults(prev => prev.map((res, idx) => idx === index ? { ...res, status: 'generating' } : res));
     addLog(`[Task ${index+1}] Starting with text: "${userTextPrompt}"`);

     try {
        if (!apiKey) {
            throw new Error("API Key is missing. Please configure it in the main settings.");
        }
        const ai = new window.GoogleGenAI({ apiKey });
        const platformName = platform === '16:9' ? 'YouTube' : 'Facebook';
        
        const textProtocolPrompt = generationMode === 'creative' ? `
          **[ZERO-TOLERANCE PROTOCOL: VIETNAMESE LANGUAGE ACCURACY - CREATIVE MODE]**
          *   **GUIDING THEME:** Your primary guide is the user's text: "${userTextPrompt}".
          *   **CREATIVE INTERPRETATION:** You are allowed to creatively interpret this theme. You can slightly rephrase or use a powerful keyword from the user's text for maximum visual impact on the thumbnail.
          *   **ABSOLUTE MANDATE:** Despite creative freedom, any text you DO render must have **100% PERFECT VIETNAMESE ACCURACY**.
          *   **DEFINITION OF FAILURE:** A single error in spelling, grammar, or diacritics (dấu) constitutes a **COMPLETE MISSION FAILURE**.
          *   **DIACRITICS CHECKLIST (MUST VERIFY):** dấu sắc (´), dấu huyền (\`), dấu hỏi (?), dấu ngã (~), dấu nặng (.).
          *   **MANDATORY SELF-CORRECTION:** Before outputting the final image, you MUST perform an internal check. If the rendered text does not have perfect Vietnamese, you are REQUIRED to regenerate it until it is a 100% match. This is not optional.
          ---
        ` : `
          **[ZERO-TOLERANCE PROTOCOL: VIETNAMESE LANGUAGE ACCURACY - ACCURATE MODE]**
          *   **ABSOLUTE MANDATE:** Your primary, non-negotiable mission is to render the following Vietnamese text with **100% PERFECT ACCURACY**.
          *   **TEXT TO RENDER (EXACTLY AS WRITTEN):** "${userTextPrompt}"
          *   **DEFINITION OF FAILURE:** A single error in spelling, grammar, or diacritics (dấu) constitutes a **COMPLETE MISSION FAILURE**. There is no partial success.
          *   **DIACRITICS CHECKLIST (MUST VERIFY):** dấu sắc (´), dấu huyền (\`), dấu hỏi (?), dấu ngã (~), dấu nặng (.).
          *   **MANDATORY SELF-CORRECTION:** Before outputting the final image, you MUST perform an internal check. If the rendered text does not perfectly match the input text, you are REQUIRED to regenerate it until it is a 100% match. This is not optional.
          ---
        `;

        if (characterImage) {
          addLog(`[Task ${index+1}] Pre-compositing character image to enforce ${platform} aspect ratio...`);
          const compositedImage = await createImageOnCanvas(characterImage, platform);
          addLog(`[Task ${index+1}] Image pre-composited. Sending to AI Art Director...`);

          const parts = [];
          
          let finalPrompt;
            if (showTextOnThumbnail) {
                finalPrompt = `
              **MISSION: VIRAL THUMBNAIL CREATION**

              ${textProtocolPrompt}

              **[ART DIRECTION & CREATIVE EXECUTION]**
              1.  **CORE TASK:** Transform the uploaded image. The person in the image is the main character, but you must reimagine everything else: pose, action, clothing, and background to create a dynamic, viral-quality scene.
              2.  **ACCESSORY INTEGRATION (If accessory image is provided):** The character MUST be wearing or using the accessory from the secondary image in a natural and visually appealing way. The accessory's design, shape, and color must be preserved with 100% fidelity.
              3.  **THEME:** The visual theme must perfectly match the text.
              4.  **TEXT STYLE:** Text must be large, stylish, and instantly readable.
              5.  **FONT SELECTION:** You have the creative freedom to choose a professional, bold, and highly readable font. The font choice MUST support all Vietnamese characters and diacritics perfectly.
              6.  **USER GUIDANCE:** ${creativeNotes.trim() ? creativeNotes : 'Use expert art direction for a highly clickable thumbnail.'}
              7.  **FACIAL IDENTITY (NON-NEGOTIABLE):** The character's face, features, and identity MUST be preserved with 100% accuracy from the uploaded photo. This is the most critical instruction. Do not alter the face.
              8.  **ASPECT RATIO:** Maintain the EXACT aspect ratio of the input image. DO NOT ALTER IT.
              
              **FINAL REVIEW:** Is the Vietnamese text flawless? Is the person recognizable? Is the thumbnail visually compelling? If all answers are YES, complete the mission.
            `;
            } else {
                finalPrompt = `
              **MISSION: VIRAL THUMBNAIL CREATION (VISUALS ONLY)**

              **[ART DIRECTION & CREATIVE EXECUTION]**
              1.  **CORE TASK:** Transform the uploaded image based on a visual theme. The person in the image is the main character, but you must reimagine everything else: pose, action, clothing, and background to create a dynamic, viral-quality scene. **DO NOT ADD ANY TEXT TO THE IMAGE.**
              2.  **ACCESSORY INTEGRATION (If accessory image is provided):** The character MUST be wearing or using the accessory from the secondary image in a natural and visually appealing way. The accessory's design, shape, and color must be preserved with 100% fidelity.
              3.  **THEME:** The visual theme is: "${userTextPrompt}". All visuals must powerfully represent this concept.
              4.  **USER GUIDANCE:** ${creativeNotes.trim() ? creativeNotes : 'Use expert art direction for a highly clickable thumbnail.'}
              5.  **FACIAL IDENTITY (NON-NEGOTIABLE):** The character's face, features, and identity MUST be preserved with 100% accuracy from the uploaded photo. This is the most critical instruction. Do not alter the face.
              6.  **ASPECT RATIO:** Maintain the EXACT aspect ratio of the input image. DO NOT ALTER IT.

              **FINAL REVIEW:** Is the person recognizable? Is the thumbnail visually compelling based on the theme? Is there absolutely NO TEXT on the image? If all answers are YES, complete the mission.
            `;
            }
          
          parts.push({ text: finalPrompt });
          parts.push({ inlineData: { mimeType: compositedImage.mimeType, data: compositedImage.base64 }});
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
          addLog(`[Task ${index+1}] Thumbnail ready!`, 'success');

        } else {
          addLog(`[Task ${index+1}] Generating new image with specialized model (Imagen) to enforce aspect ratio...`);
          
          const creativeGuidanceForImagen = creativeNotes.trim()
              ? `**User's Creative Guidance (High Priority):** ${creativeNotes}`
              : '';
          
          let finalImagenPrompt;
            if (showTextOnThumbnail) {
                finalImagenPrompt = `
                **MISSION: Create ONE viral-quality thumbnail for ${platformName}.**

                ${textProtocolPrompt}

                **[DESIGN & STYLE REQUIREMENTS]**
                *   **VISUAL THEME:** The entire image's concept and style must creatively and powerfully represent the topic: "${userTextPrompt}".
                *   **FONT:** Choose a professional, bold, and highly readable font that is stylistically appropriate and ensures perfect Vietnamese character rendering.
                *   **STYLE:** Vibrant, high-contrast, professional, and extremely eye-catching. Use modern graphic design principles for maximum clickability.
                *   **USER GUIDANCE:** ${creativeGuidanceForImagen}
                *   **COMPOSITION:** Create a dynamic and engaging composition. AVOID boring, centered layouts. Integrate text and visuals seamlessly for maximum impact.
                ---
                **FINAL GOAL:** A visually stunning thumbnail with FLAWLESSLY RENDERED VIETNAMESE TEXT that is impossible to ignore.
              `;
            } else {
                finalImagenPrompt = `
                **MISSION: Create ONE viral-quality thumbnail for ${platformName} (VISUALS ONLY).**

                **[DESIGN & STYLE REQUIREMENTS]**
                *   **VISUAL THEME:** The entire image's concept and style must creatively and powerfully represent the topic: "${userTextPrompt}". **DO NOT RENDER ANY TEXT ON THE IMAGE.**
                *   **STYLE:** Vibrant, high-contrast, professional, and extremely eye-catching. Use modern graphic design principles for maximum clickability.
                *   **USER GUIDANCE:** ${creativeGuidanceForImagen}
                *   **COMPOSITION:** Create a dynamic and engaging composition. AVOID boring, centered layouts.
                ---
                **FINAL GOAL:** A visually stunning thumbnail that represents the theme perfectly, with absolutely NO TEXT.
              `;
            }

          const response = await ai.models.generateImages({
              model: 'imagen-4.0-generate-001',
              prompt: finalImagenPrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: platform, 
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
          addLog(`[Task ${index+1}] Thumbnail ready! (Aspect ratio enforced)`, 'success');
        }
     } catch(error) {
        const errorMessage = parseAndEnhanceErrorMessage(error);
        addLog(`[Task ${index+1}] Error: ${errorMessage}`, 'error');
        setResults(prev => prev.map((res, idx) => 
            idx === index ? { ...res, status: 'error', error: errorMessage } : res
        ));
     }
  };

  const handleGenerateClick = async () => {
    if (!apiKey) {
      addLog('Vui lòng cài đặt API Key trước khi tạo.', 'error');
      return;
    }
    const promptList = prompts.split('\n').filter(p => p.trim() !== '');
    if (promptList.length === 0 && !characterImage) {
      addLog('Vui lòng nhập nội dung chữ hoặc tải ảnh nhân vật lên.', 'warning');
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
    addLog(`Bắt đầu tạo ${tasks.length} thumbnail...`);
    setResults(tasks);

    for (let i = 0; i < tasks.length; i++) {
        await generateThumbnail(tasks[i].prompt, i);
    }

    setIsGenerating(false);
    addLog('Hoàn tất tất cả các tác vụ.', 'info');
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
    React.createElement('div', { className: "flex flex-col lg:flex-row gap-8" },
      React.createElement('div', { className: "lg:w-2/5 xl:w-1/3 flex-shrink-0 space-y-8" },
        React.createElement('div', null,
          React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "1. Tùy chỉnh"),
          React.createElement('div', { className: "bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4" },
              React.createElement(PlatformSelector, { platform, setPlatform, isGenerating }),
              React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                React.createElement(SingleImageUploader, { 
                    uploadedImage: characterImage, 
                    setUploadedImage: setCharacterImage, 
                    isGenerating, 
                    title: "Upload ảnh nhân vật",
                    helpText: "(Bắt buộc nếu không nhập chữ)"
                }),
                React.createElement(SingleImageUploader, { 
                    uploadedImage: accessoryImage, 
                    setUploadedImage: setAccessoryImage, 
                    isGenerating, 
                    title: "Upload ảnh phụ kiện",
                    helpText: "(Tùy chọn)"
                })
              ),
              React.createElement(ImageCountSelector, { numberOfImages, setNumberOfImages, isGenerating })
          )
        ),

        React.createElement('div', null,
          React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "2. Nhập nội dung"),
          React.createElement('div', { className: "bg-slate-900/50 p-4 rounded-lg border border-slate-700" },
              React.createElement('div', { className: "flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4" },
                  React.createElement(Button, {
                      variant: generationMode === 'accurate' ? 'active' : 'secondary',
                      onClick: () => setGenerationMode('accurate'),
                      disabled: isGenerating,
                      className: "flex-1",
                      children: "Chính xác"
                  }),
                  React.createElement(Button, {
                      variant: generationMode === 'creative' ? 'active' : 'secondary',
                      onClick: () => setGenerationMode('creative'),
                      disabled: isGenerating,
                      className: "flex-1",
                      children: "Sáng tạo"
                  })
              ),
              React.createElement(Button, {
                  variant: showTextOnThumbnail ? 'active' : 'secondary',
                  onClick: () => setShowTextOnThumbnail(!showTextOnThumbnail),
                  disabled: isGenerating,
                  className: "w-full mb-4",
                  children: showTextOnThumbnail ? 'Đang hiển thị Text' : 'Đang ẩn Text'
              }),
              React.createElement('label', { htmlFor: "prompt-textarea-image", className: "block text-sm font-semibold mb-1" },
                  "Nội dung hiển trên Thumbnail"
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
         React.createElement(ResultsPanel, { results, platform })
      )
    )
  );
};

const CreateThumbnailApp = ({ apiKey }) => {
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const newLog = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs(prev => [newLog, ...prev.slice(0, 100)]);
  };
  
  const getLogColor = (type) => {
    switch (type) {
        case 'success': return 'text-green-400';
        case 'error': return 'text-red-400';
        case 'warning': return 'text-yellow-400';
        default: return 'text-gray-400';
    }
  }

  return (
    React.createElement('div', { className: "min-h-screen w-full p-4" },
      React.createElement('main', { className: "text-gray-300 space-y-6 h-full" },
          React.createElement(ThumbnailGeneratorTab, { addLog, apiKey }),
          logs.length > 0 && (
             React.createElement('div', null,
                React.createElement('h3', { className: "text-lg font-bold text-white mb-2" }, "Logs"),
                React.createElement('div', { className: "bg-slate-900/50 border border-slate-700 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs" },
                    logs.map(log => (
                        React.createElement('p', { key: log.id, className: "flex" },
                            React.createElement('span', { className: "text-gray-500 mr-2 flex-shrink-0" }, log.timestamp),
                            React.createElement('span', { className: `${getLogColor(log.type)} break-all` }, log.message)
                        )
                    ))
                )
            )
          )
      )
    )
  );
};

export default CreateThumbnailApp;
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
// CUSTOM UI COMPONENTS for TAO ANH TREND
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

const MultiImageUploader = ({ uploadedImages, setUploadedImages, isGenerating, title, maxImages = 4 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentImages = [...uploadedImages];
      const filesToProcess = Array.from(files).slice(0, maxImages - currentImages.length);
      
      // Fix: Explicitly type the 'file' parameter to resolve TypeScript errors with 'unknown' type.
      filesToProcess.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const newImage = {
              id: `${file.name}-${Date.now()}`,
              base64: reader.result.split(',')[1],
              dataUrl: reader.result,
              mimeType: file.type,
            };
            setUploadedImages(prev => [...prev, newImage]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (idToRemove: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  return (
    React.createElement('div', null,
      React.createElement('label', { className: "block text-sm font-semibold mb-2" }, title),
      React.createElement('div', {
        className: "w-full min-h-32 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg p-2 flex flex-wrap gap-2 items-center justify-center transition"
      },
        uploadedImages.map(image => (
          React.createElement('div', { key: image.id, className: "relative w-24 h-24 group flex-shrink-0" },
            React.createElement('img', { src: image.dataUrl, alt: "Preview", className: "w-full h-full object-cover rounded-md" }),
            (() => {
                const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
                    onClick: () => !isGenerating && removeImage(image.id),
                    className: "absolute top-0.5 right-0.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-0.5 leading-none shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100",
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
        )),
        uploadedImages.length < maxImages && (
          React.createElement('div', {
            onClick: () => !isGenerating && fileInputRef.current?.click(),
            className: "w-24 h-24 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-slate-700 rounded-md transition-colors"
          },
            React.createElement('p', null, "+ Thêm ảnh"),
            React.createElement('p', { className: "text-xs" }, `(${uploadedImages.length}/${maxImages})`)
          )
        )
      ),
      React.createElement('input', {
        type: "file",
        ref: fileInputRef,
        className: "hidden",
        onChange: handleFileChange,
        accept: "image/png, image/jpeg, image/webp",
        disabled: isGenerating || uploadedImages.length >= maxImages,
        multiple: true
      })
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
const TrendImageGeneratorTab = ({ addLog, apiKey }) => {
  const [theme, setTheme] = useState('');
  const [creativeNotes, setCreativeNotes] = useState('');
  const [results, setResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [platform, setPlatform] = useState('16:9');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [characterImages, setCharacterImages] = useState<UploadedImage[]>([]);
  const MAX_IMAGES = 4;
  
  const generateImage = async (taskTheme, index) => {
     setResults(prev => prev.map((res, idx) => idx === index ? { ...res, status: 'generating' } : res));
     addLog(`[Task ${index+1}] Starting with theme: "${taskTheme}"`);

     try {
        if (!apiKey) {
            throw new Error("API Key is missing. Please configure it in the main settings.");
        }
        if (characterImages.length === 0) {
            throw new Error("Character image is required for this function.");
        }

        const ai = new window.GoogleGenAI({ apiKey });
        
        addLog(`[Task ${index+1}] Pre-compositing ${characterImages.length} character image(s) to enforce ${platform} aspect ratio...`);
        const compositedImagePromises = characterImages.map(img => createImageOnCanvas(img, platform));
        const compositedImages = await Promise.all(compositedImagePromises);
        addLog(`[Task ${index+1}] Images pre-composited. Sending to AI Art Director...`);

        const parts = [];
        const finalPrompt = `
            **MISSION: CREATIVE GROUP PORTRAIT**

            **[CORE TASK & NON-NEGOTIABLE RULES]**
            1.  **COMBINE CHARACTERS:** You are provided with ${characterImages.length} separate image(s), each featuring one person. Your primary task is to create a SINGLE, new, cohesive image that includes ALL ${characterImages.length} of these individuals together.
            2.  **FACIAL IDENTITY (ABSOLUTE PRIORITY):** The face, features, and identity of EACH person from the uploaded photos MUST be preserved with 100% accuracy. This is the most critical instruction. Do not alter their faces.
            3.  **THEME & SETTING:** The entire scene, including the background, clothing, and atmosphere, must be creatively reimagined based on the user's theme: "${taskTheme}".
            4.  **USER GUIDANCE:** Incorporate these creative notes from the user: "${creativeNotes.trim() ? creativeNotes : 'Use expert art direction for a visually stunning and creative image.'}"
            5.  **NO TEXT:** The final image must NOT contain any text, letters, or numbers. This is a strict rule.
            6.  **PHOTOREALISM:** The final image should be photorealistic and high-quality. Avoid cartoon or animated styles unless specifically requested in the theme or creative notes.
            7.  **ASPECT RATIO:** Maintain the EXACT aspect ratio of the input images (${platform}). DO NOT ALTER IT.

            **FINAL REVIEW:** Does the image contain all ${characterImages.length} people? Are all faces recognizable? Does the scene match the theme? Is there absolutely NO TEXT on the image? If all answers are YES, complete the mission.
        `;
        
        parts.push({ text: finalPrompt });
        compositedImages.forEach(img => {
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
        addLog(`[Task ${index+1}] Image ready!`, 'success');
        
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
    if (characterImages.length === 0) {
      addLog('Vui lòng tải ít nhất một ảnh nhân vật.', 'warning');
      return;
    }
    if (!theme.trim()) {
        addLog('Vui lòng nhập chủ đề cho ảnh.', 'warning');
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
    addLog(`Bắt đầu tạo ${tasks.length} ảnh theo chủ đề "${theme}"...`);
    setResults(tasks);

    for (let i = 0; i < tasks.length; i++) {
        await generateImage(tasks[i].prompt, i);
    }

    setIsGenerating(false);
    addLog('Hoàn tất tất cả các tác vụ.', 'info');
  };
  
  const totalImages = characterImages.length > 0 ? numberOfImages : 0;
  const canGenerate = isGenerating || characterImages.length === 0 || !theme.trim();

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
              React.createElement(PlatformSelector, { platform, setPlatform, isGenerating }),
              React.createElement(MultiImageUploader, { 
                    uploadedImages: characterImages, 
                    setUploadedImages: setCharacterImages, 
                    isGenerating, 
                    title: "Upload ảnh nhân vật",
                    maxImages: MAX_IMAGES
              }),
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
         React.createElement(ResultsPanel, { results, platform })
      )
    )
  );
};

const TaoAnhTrendApp = ({ apiKey }) => {
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
          React.createElement(TrendImageGeneratorTab, { addLog, apiKey }),
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

export default TaoAnhTrendApp;

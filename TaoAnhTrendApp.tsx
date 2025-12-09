import React, { useState, useRef } from 'react';

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

const TaoAnhTrendApp: React.FC<{ geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }> = ({ geminiApiKey, openaiApiKey, selectedAIModel }) => {
  // State variables
  const [faceImage, setFaceImage] = useState<UploadedImage | null>(null);
  const [styleImage, setStyleImage] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const handleGenerate = async () => {
    if (!faceImage || !styleImage) {
      setError('Vui lòng tải lên cả ảnh khuôn mặt và ảnh phong cách.');
      return;
    }
    if (!geminiApiKey && !openaiApiKey) {
      setError('Vui lòng cài đặt ít nhất một API Key (Gemini hoặc OpenAI).');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    
    let finalError: unknown = null;
    let generatedSuccess = false;

    // 1. Try Gemini (Priority)
    if ((selectedAIModel === 'gemini' || selectedAIModel === 'auto') && geminiApiKey) {
        try {
            const ai = new (window as any).GoogleGenAI({ apiKey: geminiApiKey });
            const finalPrompt = `
                **MISSION: CREATE A TRENDING IMAGE**
                **[CORE INSTRUCTIONS]**
                1.  **Face Source:** The primary subject's face MUST be taken from the first uploaded image (the 'face' image). Preserve the facial features and identity with 100% accuracy.
                2.  **Style Source:** The artistic style, color palette, clothing, background, and overall mood MUST be taken from the second uploaded image (the 'style' image).
                3.  **Combine:** Seamlessly blend the face from the first image onto a character that fits perfectly within the world and style of the second image.
                4.  **User Prompt (Optional):** ${prompt ? `Incorporate this user request: "${prompt}"` : ''}
                5.  **Final Output:** A single, cohesive, high-quality image. The aspect ratio must be ${aspectRatio}.

                **MANDATORY CHECKLIST:**
                - Does the final image have the exact face from the first image? -> If not, FAIL.
                - Does the final image have the exact style, mood, and elements from the second image? -> If not, FAIL.
            `;

            const parts = [
                { text: finalPrompt },
                { inlineData: { mimeType: faceImage.mimeType, data: faceImage.base64 } },
                { inlineData: { mimeType: styleImage.mimeType, data: styleImage.base64 } },
            ];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
            });

            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (!imagePart?.inlineData?.data) {
                throw new Error('Không nhận được dữ liệu hình ảnh từ API. Phản hồi của AI: ' + (response.text || 'trống'));
            }
            
            const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            setGeneratedImage(imageUrl);
            generatedSuccess = true;
        } catch (e: any) {
            console.warn("Gemini failed", e);
            if (selectedAIModel === 'gemini') throw e;
            finalError = e;
        }
    }
    
    // 2. Try OpenAI (Fallback)
    if (!generatedSuccess && (selectedAIModel === 'openai' || selectedAIModel === 'auto') && openaiApiKey) {
        try {
            const fallbackPrompt = `Create a trending image with an artistic style, color palette, and mood inspired by a famous painting or movie scene. The image should feature a character. Incorporate this user request: "${prompt}". The aspect ratio is ${aspectRatio}. IMPORTANT: This is a creative interpretation, do not attempt to replicate specific faces.`;
            const sizeMap = { '16:9': '1792x1024', '9:16': '1024x1792', '1:1': '1024x1024' };
            const response = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt || fallbackPrompt,
                n: 1,
                size: sizeMap[aspectRatio] || '1024x1024',
                response_format: 'b64_json',
                quality: 'hd'
              })
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`OpenAI DALL-E Error: ${errorData.error.message}`);
            }
            const data = await response.json();
            const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
            setGeneratedImage(imageUrl);
            generatedSuccess = true;
        } catch (e) {
            console.warn("OpenAI failed", e);
            finalError = e;
        }
    }


    if (!generatedSuccess) {
      setError(parseAndEnhanceErrorMessage(finalError || new Error("Tất cả các API đều thất bại.")));
    }

    setIsGenerating(false);
  };

  return (
    React.createElement('div', { className: 'w-full h-full p-4 grid grid-cols-1 lg:grid-cols-2 gap-8' },
      // Left Panel
      React.createElement('div', { className: 'bg-slate-900/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-white' }, 'Tạo ảnh theo Trend'),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement(SingleImageUploader, {
            label: '1. Tải ảnh khuôn mặt',
            uploadedImage: faceImage,
            setUploadedImage: setFaceImage,
            isGenerating: isGenerating,
            placeholderText: 'Ảnh chân dung',
          }),
          React.createElement(SingleImageUploader, {
            label: '2. Tải ảnh phong cách',
            uploadedImage: styleImage,
            setUploadedImage: setStyleImage,
            isGenerating: isGenerating,
            placeholderText: 'Ảnh style',
          })
        ),
        React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-semibold mb-2' }, '3. Mô tả thêm (tùy chọn)'),
            React.createElement('textarea', {
                value: prompt,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value),
                placeholder: 'Ví dụ: nhân vật đang mỉm cười, thêm một chiếc mũ...',
                className: 'w-full bg-slate-800 border border-slate-600 rounded-md p-3 text-base text-gray-200 h-24',
                disabled: isGenerating
            } as React.TextareaHTMLAttributes<HTMLTextAreaElement>)
        ),
        React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-semibold mb-2 text-center' }, '4. Chọn tỷ lệ'),
            React.createElement(AspectRatioSelector, {
                selectedRatio: aspectRatio,
                onSelect: setAspectRatio,
                disabled: isGenerating
            })
        ),
        React.createElement(Button, {
            variant: 'primary',
            className: 'w-full text-lg py-3',
            onClick: handleGenerate,
            disabled: isGenerating || !faceImage || !styleImage,
            children: isGenerating ? 
              React.createElement('span', { className: "flex items-center justify-center" }, React.createElement(Spinner), " Đang tạo...") : 
              '5. Tạo ảnh'
        })
      ),
      // Right Panel
      React.createElement('div', { className: 'bg-slate-900/50 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center' },
        isGenerating ? React.createElement(Spinner) :
        error ? React.createElement(ErrorDisplay, { message: error }) :
        generatedImage ? (
          React.createElement('div', { className: 'w-full h-full flex flex-col items-center gap-4' },
            React.createElement('img', { src: generatedImage, alt: 'Generated trend image', className: 'max-w-full max-h-[70vh] object-contain rounded-lg' }),
            React.createElement('a', {
              href: generatedImage,
              download: 'trend-image.png',
              children: React.createElement(Button, { variant: 'secondary', children: 'Tải ảnh xuống' })
            })
          )
        ) : (
          React.createElement('p', { className: 'text-center text-gray-500' }, 'Kết quả sẽ hiện ở đây.')
        )
      )
    )
  );
};

export default TaoAnhTrendApp;
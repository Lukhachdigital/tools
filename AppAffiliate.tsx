import React, { useState, useCallback, useRef, useEffect } from 'react';

const WandIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" })
    )
);

const SparklesIcon = ({ className = 'w-5 h-5' }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" })
    )
);

const FilmIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" })
    )
);

const CopyIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" })
    )
);

const CheckIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
    )
);

const SaveIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" })
    )
);

type UploadedImage = {
  id: string;
  base64: string;
  dataUrl: string;
  mimeType: string;
};

const SingleImageUploader = ({ label, uploadedImage, setUploadedImage, isGenerating, placeholderText }) => {
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
      React.createElement('div', {className: 'flex flex-col items-center'},
        React.createElement('h3', { className: "text-md font-semibold text-slate-300 mb-2" }, label),
        React.createElement('div', { 
          className: `w-full aspect-square bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center transition relative group ${isGenerating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-700'}`,
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


const SkeletonLoader = () => (
    React.createElement('div', { className: "w-full animate-pulse flex flex-col gap-4" },
        React.createElement('div', { className: "aspect-square bg-slate-700 rounded-lg" }),
        React.createElement('div', { className: "h-4 bg-slate-700 rounded w-3/4" }),
        React.createElement('div', { className: "h-4 bg-slate-700 rounded w-full" }),
        React.createElement('div', { className: "h-4 bg-slate-700 rounded w-1/2" })
    )
);

const GeneratedContent = ({ image, promptSets, isLoading }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSaveImage = () => {
        if (image) {
            const link = document.createElement('a');
            link.href = image;
            link.download = `ai-product-shot-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const promptSet = promptSets?.[0];

    return (
        React.createElement('div', { className: "bg-slate-800/50 border border-slate-700 rounded-xl p-4 min-h-[300px] flex flex-col" },
            React.createElement('div', { className: "flex justify-between items-center mb-4" },
                React.createElement('h3', { className: "text-lg font-semibold text-slate-300" }, "Kết quả từ AI"),
                image && (
                    React.createElement('button', {
                        onClick: handleSaveImage,
                        className: "flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-lg border-b-2 border-slate-800 hover:bg-slate-600 transition-all transform active:translate-y-0.5"
                    },
                        React.createElement(SaveIcon),
                        React.createElement('span', null, "Lưu ảnh")
                    )
                )
            ),
            isLoading ? (
                React.createElement(SkeletonLoader)
            ) : image && promptSet ? (
                React.createElement('div', { className: "space-y-4" },
                    React.createElement('img', { src: image, alt: "Generated content", className: "w-full object-contain rounded-lg shadow-lg" }),
                    React.createElement('div', { className: "bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-3" },
                        React.createElement('div', null,
                            React.createElement('h4', { className: "font-semibold text-blue-400 flex items-center gap-2" }, React.createElement(SparklesIcon), " Lời thoại"),
                            React.createElement('p', { className: "text-slate-300 mt-2 text-sm md:text-base" }, promptSet.description)
                        ),
                        promptSet.animationPrompt && (() => {
                            const formattedPrompt = JSON.stringify(promptSet.animationPrompt, null, 2);
                            return (
                                React.createElement('div', null,
                                    React.createElement('div', { className: "flex justify-between items-center mb-2" },
                                        React.createElement('h4', { className: "font-semibold text-purple-400 flex items-center gap-2" }, React.createElement(FilmIcon), " Prompt Chuyển động"),
                                        React.createElement('button', {
                                            onClick: () => handleCopy(formattedPrompt),
                                            className: "flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-lg border-b-2 border-slate-800 hover:bg-slate-600 transition-all transform active:translate-y-0.5 disabled:bg-green-600 disabled:border-green-800 disabled:text-white",
                                            disabled: copied
                                        },
                                            copied ? React.createElement(CheckIcon) : React.createElement(CopyIcon),
                                            React.createElement('span', null, copied ? 'Đã chép!' : 'Sao chép')
                                        )
                                    ),
                                    React.createElement('pre', { className: "text-slate-300 text-xs md:text-sm whitespace-pre-wrap font-sans bg-slate-900 p-3 rounded" }, formattedPrompt)
                                )
                            )
                        })()
                    )
                )
            ) : (
                React.createElement('div', { className: "text-center text-slate-500 flex flex-col items-center justify-center h-full flex-grow" },
                    React.createElement(SparklesIcon, { className: "w-12 h-12" }),
                    React.createElement('p', { className: "mt-2" }, "Kết quả của bạn sẽ xuất hiện ở đây.")
                )
            )
        )
    );
};

const generateTextAndPromptSet = async (
    ai,
    productImageBase64,
    generatedImageBase64,
    voice,
    region,
    productInfo,
    seed,
    generationMode
) => {
    const voiceDescription = voice === 'male' ? 'a male' : 'a female';
    const regionDescription = region === 'south' ? 'Southern Vietnamese' : 'Northern Vietnamese';
    const productInfoContext = productInfo
        ? `Critically, you MUST use the following user-provided "Product Information" as the primary inspiration for the description: "${productInfo}". For this specific generation (seed ${seed}), you MUST create a UNIQUE and CREATIVE variation that has NOT been generated before. Focus on a different feature or angle.`
        : "Analyze the product image to understand its key features and create an appealing, UNIQUE description.";

    const contextItem = generationMode === 'fashion' ? 'fashion item' : 'product';

    const textAndPromptGenResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: `Based on the unique qualities of the provided ${contextItem} image, the generated promotional image, and the user's product info, perform two tasks and return the result as a single JSON object with keys "description" and "animationPrompt".

IMPORTANT for seed ${seed}: Your response must be COMPLETELY UNIQUE and DIFFERENT from any previous attempts. Create a fresh, new idea for both the description and the camera movement.

1.  **description**: Write a concise promotional description in Vietnamese. The length MUST be short, between 15 and 25 words. This is a strict limit for an 8-second voiceover. CRITICAL RULE: The description MUST include commas (,) and periods (.) to create natural pauses for the voiceover. The punctuation is essential for the text-to-speech engine to generate realistic speech patterns. ${productInfoContext}

2.  **animationPrompt**: Build a detailed video prompt as a structured JSON object for a video generation model like VEO 3.1. This prompt must create a vivid and dynamic 8-second TikTok video in an "Outfit Showcase" style, with a special focus on lively and engaging camera movements.
    - The JSON object must contain the following keys: "sceneDescription", "characterAction", "cameraMovement", "lighting", "facialExpression", "videoDuration", and "audioDescription".
    - "cameraMovement" MUST be a unique, dynamic, and creative camera movement. DO NOT use static shots or repeat previous camera movements.
    - "videoDuration" must be exactly "8 seconds".
    - "audioDescription" must describe BOTH the voiceover and suitable background music. The description MUST start with 'Voiceover (Vietnamese):' followed by the EXACT Vietnamese text you just generated for the 'description' field. For example: 'Voiceover (Vietnamese): [Your generated Vietnamese text here]. Music: upbeat lo-fi hip hop.'. The accent should be ${regionDescription} for the ${voiceDescription} voice.
    - All other fields must be filled with creative, detailed descriptions in English based on the generated image.` },
                { text: `${generationMode === 'fashion' ? 'Fashion Item Image' : 'Product Image'}:` },
                { inlineData: { data: productImageBase64, mimeType: 'image/jpeg' } },
                { text: "Generated Promotional Image with Person:" },
                { inlineData: { data: generatedImageBase64, mimeType: 'image/jpeg' } }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: window.GenAIType.OBJECT,
                properties: {
                    description: {
                        type: window.GenAIType.STRING,
                        description: "Promotional product description in Vietnamese, suitable for an 8-second voiceover (15-25 words). It MUST include commas and periods for natural voiceover pacing."
                    },
                    animationPrompt: {
                        type: window.GenAIType.OBJECT,
                        description: "A detailed VEO 3.1 video generation prompt as a structured JSON object.",
                        properties: {
                            sceneDescription: { type: window.GenAIType.STRING, description: "Description of the scene and background." },
                            characterAction: { type: window.GenAIType.STRING, description: "Detailed movement of the character." },
                            cameraMovement: { type: window.GenAIType.STRING, description: "How the camera moves. MUST be dynamic and lively. Use cinematic terms like 'smooth panning shot', 'dolly zoom in', 'orbital shot around the character', 'handheld follow shot', 'crane shot revealing the scene'. AVOID static shots." },
                            lighting: { type: window.GenAIType.STRING, description: "The style of lighting (e.g., golden hour, studio)." },
                            facialExpression: { type: window.GenAIType.STRING, description: "The character's facial expression." },
                            videoDuration: { type: window.GenAIType.STRING, description: "The exact duration of the video." },
                            audioDescription: { type: window.GenAIType.STRING, description: "Description of the voiceover and background music. MUST contain the full Vietnamese voiceover text." }
                        },
                        required: ["sceneDescription", "characterAction", "cameraMovement", "lighting", "facialExpression", "videoDuration", "audioDescription"]
                    },
                },
                required: ["description", "animationPrompt"]
            }
        }
    });

    return JSON.parse(textAndPromptGenResponse.text);
}

const generateSingleResult = async (
    ai,
    modelImageBase64,
    productImageBase64,
    voice,
    region,
    seed,
    generationMode,
    outfitSuggestion,
    backgroundSuggestion,
    productInfo
) => {

    const backgroundPrompt = backgroundSuggestion
        ? `- **Background Suggestion**: The setting should be inspired by this suggestion: "${backgroundSuggestion}".`
        : `- **Background**: The setting must be a dynamic and interesting. CRITICAL: For this specific generation (seed ${seed}), create a COMPLETELY UNIQUE background. Explore diverse settings like a rooftop lounge at dusk, a bustling European street market, a minimalist art gallery, a tranquil Japanese garden, or inside a futuristic vehicle. AVOID simple studio backdrops.`;

    let imagePrompt;

    const promptPreamble = `Your mission is to generate a single, high-resolution, photorealistic promotional image.
The aspect ratio of the final image must be inherited from the uploaded product/fashion item image. This is a critical rule.
`;

    if (generationMode === 'fashion') {
        const complementaryOutfitPrompt = outfitSuggestion
            ? `- **Complementary Outfit Suggestion**: Style the rest of the outfit to complement the main fashion item, inspired by this suggestion: "${outfitSuggestion}".`
            : `- **Complementary Outfit**: Style the rest of the outfit to be fashionable and contextually appropriate, complementing the main fashion item. CRITICAL: For this specific generation (seed ${seed}), invent a COMPLETELY UNIQUE complementary outfit. Be creative with accessories, shoes, and other items.`;

        imagePrompt = `${promptPreamble}
- **Person**: The person from the first image must be featured. Their facial features, body type, and appearance must be preserved exactly.
- **Fashion Item**: The person MUST be wearing the fashion item (e.g., shirt, pants, dress) from the second image. The item's design, color, texture, and shape MUST be preserved with 100% fidelity and fitted naturally onto the person. IT IS CRITICAL THAT YOU DO NOT ALTER THE ORIGINAL ITEM IN ANY WAY.
${complementaryOutfitPrompt}
${backgroundPrompt}
- **Style**: The style should be high-end and polished, suitable for a fashion lookbook or advertisement.
- **Composition**: The shot MUST be a full-body or three-quarters shot of the model to showcase the entire outfit in context.
- **Variation Seed**: ${seed}.

**FINAL MANDATORY CHECKLIST:**
1.  **PERSON:** Is the person from image 1 recognizable? -> If not, FAIL.
2.  **ITEM:** Is the fashion item from image 2 accurately represented? -> If not, FAIL.`;
    } else { 
        const outfitPrompt = outfitSuggestion
            ? `- **Outfit Suggestion**: The person should be wearing an outfit inspired by this suggestion: "${outfitSuggestion}".`
            : `- **Outfit**: The person must be wearing a stylish and contextually appropriate outfit. CRITICAL: For this specific generation (seed ${seed}), invent a COMPLETELY UNIQUE outfit. Do not repeat styles from other generations. Be creative with different clothing items (e.g., blazer and jeans, summer dress, sportswear, elegant gown).`;

        imagePrompt = `${promptPreamble}
- **Person**: The person from the first image must be featured. Their facial features and appearance must be preserved exactly.
- **Product**: The product from the second image must be featured. The product's appearance, branding, color, and shape MUST be preserved with 100% fidelity. IT IS CRITICAL THAT YOU DO NOT ALTER THE ORIGINAL PRODUCT IN ANY WAY.
- **REALISTIC SCALING (CRITICAL)**: The product's size MUST be realistic and proportional to the person. It should look natural, as it would in real life. DO NOT enlarge the product for emphasis. This realism is more important than making the product highly visible.
- **Interaction**: The person should be interacting with or presenting the product in a natural, engaging way.
${outfitPrompt}
${backgroundPrompt}
- **Style**: The style should be high-end and polished, suitable for a professional advertisement.
- **Composition**: The shot MUST be a full-body shot of the model to showcase the entire outfit and product in context.
- **Variation Seed**: ${seed}.

**FINAL MANDATORY CHECKLIST:**
1.  **PERSON:** Is the person from image 1 recognizable? -> If not, FAIL.
2.  **PRODUCT:** Is the product from image 2 accurately represented and realistically scaled? -> If not, FAIL.`;
    }

    const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: imagePrompt },
                { inlineData: { data: modelImageBase64, mimeType: 'image/jpeg' } },
                { inlineData: { data: productImageBase64, mimeType: 'image/jpeg' } },
            ],
        },
        config: {
            responseModalities: [window.GenAIModality.IMAGE],
        },
    });

    const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        throw new Error('Không thể tạo ảnh từ AI.');
    }
    const generatedImageBase64 = imagePart.inlineData.data;
    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${generatedImageBase64}`;

    const promptSet = await generateTextAndPromptSet(
        ai,
        productImageBase64,
        generatedImageBase64,
        voice,
        region,
        productInfo,
        seed,
        generationMode
    );

    return {
        imageUrl: imageUrl,
        promptSets: [promptSet],
    };
};

const generateAllContent = async (
    ai,
    modelImageBase64,
    productImageBase64,
    voice,
    region,
    numberOfResults,
    generationMode,
    outfitSuggestion,
    backgroundSuggestion,
    productInfo
) => {
    const generationPromises = Array.from({ length: numberOfResults }, (_, i) =>
        generateSingleResult(
            ai,
            modelImageBase64,
            productImageBase64,
            voice,
            region,
            i, 
            generationMode,
            outfitSuggestion,
            backgroundSuggestion,
            productInfo
        )
    );

    return Promise.all(generationPromises);
};

const OptionGroup = ({ label, children }) => (
    React.createElement('div', { className: "flex flex-col items-center gap-2" },
        React.createElement('label', { className: "block text-sm font-medium text-slate-400" }, label),
        React.createElement('div', { className: "flex items-center gap-3 flex-wrap justify-center" }, children)
    )
);

const OptionButton = ({ selected, onClick, children }) => (
    React.createElement('button', {
        onClick: onClick,
        className: `px-6 py-3 text-lg rounded-lg font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transform active:translate-y-0.5 ${selected
            ? 'bg-blue-600 text-white border-b-4 border-blue-800 shadow-xl'
            : 'bg-slate-700 text-slate-300 border-b-4 border-slate-800 hover:bg-slate-600 shadow-lg'
            }`
    },
        children
    )
);

const AspectRatioSelector = ({ selectedRatio, onSelect, disabled }) => {
    const ratios = [
        { id: '16:9', label: 'Ngang' },
        { id: '9:16', label: 'Dọc' },
        { id: '1:1', label: 'Vuông' }
    ];
    return (
        React.createElement('div', { className: "flex justify-center gap-2" },
            ratios.map(ratio => React.createElement('button', {
                key: ratio.id,
                onClick: () => onSelect(ratio.id),
                disabled: disabled,
                className: `px-4 py-2 text-sm rounded-md font-semibold transition-all flex-1 ${
                    selectedRatio === ratio.id && !disabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                }`
            }, ratio.label))
        )
    );
};


const ControlPanel = ({
    generationMode, setGenerationMode,
    voice, setVoice,
    region, setRegion,
    numberOfResults, setNumberOfResults,
    outfitSuggestion, setOutfitSuggestion,
    backgroundSuggestion, setBackgroundSuggestion,
    productInfo, setProductInfo,
    setModelImage, setProductImage,
    handleGenerateContent,
    modelImage, productImage, isLoading,
    aspectRatio, setAspectRatio,
    isGpt
}) => {
     const outfitInputProps = {
        type: "text",
        id: "outfit-suggestion",
        value: outfitSuggestion,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOutfitSuggestion(e.target.value),
        disabled: generationMode === 'fashion',
        placeholder: generationMode === 'fashion' ? 'AI sẽ tự động phối đồ phụ & phụ kiện' : 'Ví dụ: áo khoác jean, quần tây công sở...',
        className: "w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    };
    const backgroundInputProps = {
        type: "text",
        id: "background-suggestion",
        value: backgroundSuggestion,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setBackgroundSuggestion(e.target.value),
        placeholder: generationMode === 'fashion' ? 'Ví dụ: đường phố Paris, tuần lễ thời trang...' : 'Ví dụ: studio tối giản, quầy bếp sang trọng...',
        className: "w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    };
    const productInfoTextareaProps = {
        id: "product-info",
        value: productInfo,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setProductInfo(e.target.value),
        placeholder: generationMode === 'fashion' ? 'Ví dụ: Áo sơ mi lụa, chất liệu thoáng mát, chống nhăn...' : 'Ví dụ: Son môi siêu lì, giữ màu 8 tiếng, vitamin E...',
        rows: 6,
        className: "w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y"
    };

    return (
         React.createElement('div', { className: "w-full lg:w-1/3 flex-shrink-0 space-y-6" },
            React.createElement('div', { className: "bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-6" },
                React.createElement(OptionGroup, { label: "Loại Nội dung", children: [
                    React.createElement(OptionButton, { key: 'product', selected: generationMode === 'product', onClick: () => setGenerationMode('product'), children: "Sản phẩm cầm tay" }),
                    React.createElement(OptionButton, { key: 'fashion', selected: generationMode === 'fashion', onClick: () => setGenerationMode('fashion'), children: "Trang phục" })
                ]}),
                React.createElement(OptionGroup, { label: "Giọng đọc thoại", children: [
                    React.createElement(OptionButton, { key: 'female', selected: voice === 'female', onClick: () => setVoice('female'), children: "Nữ" }),
                    React.createElement(OptionButton, { key: 'male', selected: voice === 'male', onClick: () => setVoice('male'), children: "Nam" })
                ]}),
                React.createElement(OptionGroup, { label: "Vùng miền", children: [
                    React.createElement(OptionButton, { key: 'south', selected: region === 'south', onClick: () => setRegion('south'), children: "Miền Nam" }),
                    React.createElement(OptionButton, { key: 'north', selected: region === 'north', onClick: () => setRegion('north'), children: "Miền Bắc" })
                ]}),
                React.createElement(OptionGroup, { label: "Số lượng kết quả", children: 
                    [1, 2, 3, 4].map(num => (
                        React.createElement(OptionButton, { key: num, selected: numberOfResults === num, onClick: () => setNumberOfResults(num), children: num })
                    ))
                })
            ),
             React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6" },
                React.createElement('div', { className: "flex flex-col" },
                    React.createElement('label', { htmlFor: "outfit-suggestion", className: "block text-sm font-medium text-slate-400 mb-2" }, "Gợi ý trang phục (không bắt buộc)"),
                    React.createElement('input', outfitInputProps)
                ),
                React.createElement('div', { className: "flex flex-col" },
                    React.createElement('label', { htmlFor: "background-suggestion", className: "block text-sm font-medium text-slate-400 mb-2" }, "Gợi ý bối cảnh (không bắt buộc)"),
                    React.createElement('input', backgroundInputProps)
                )
            ),
            React.createElement('div', { className: "flex flex-col" },
                React.createElement('label', { htmlFor: "product-info", className: "block text-sm font-medium text-slate-400 mb-2" }, "Thông tin sản phẩm (để tạo lời thoại hay hơn)"),
                React.createElement('textarea', productInfoTextareaProps)
            ),
            React.createElement('div', null,
                isGpt && React.createElement('p', { className: "text-xs text-center text-yellow-400 p-2 bg-yellow-900/50 rounded-md mb-2" }, "Tính năng upload và ghép ảnh chỉ hỗ trợ model Gemini."),
                React.createElement(AspectRatioSelector, {
                    selectedRatio: aspectRatio,
                    onSelect: setAspectRatio,
                    disabled: !!(modelImage || productImage)
                }),
                React.createElement('p', { className: "text-sm text-center text-slate-400 my-2" }, "Bạn Upload ảnh mẫu tỷ lệ nào, ảnh kết quả sẽ là tỷ lệ tương tự"),
                React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                    React.createElement(SingleImageUploader, { 
                        label: "1. Tải ảnh khuôn mặt", 
                        uploadedImage: modelImage,
                        setUploadedImage: setModelImage, 
                        isGenerating: isLoading || isGpt,
                        placeholderText: "Upload ảnh"
                    }),
                    React.createElement(SingleImageUploader, { 
                        label: generationMode === 'product' ? "2. Tải ảnh sản phẩm" : "2. Tải ảnh trang phục (áo/quần)", 
                        uploadedImage: productImage,
                        setUploadedImage: setProductImage,
                        isGenerating: isLoading || isGpt,
                        placeholderText: "Upload ảnh"
                    })
                )
            ),
            React.createElement('div', { className: "flex justify-center mt-4" },
                React.createElement('button', {
                    id: "generate-button",
                    onClick: handleGenerateContent,
                    disabled: isLoading || (!modelImage && !productImage && !productInfo.trim()),
                    className: "w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg border-b-4 border-blue-800 hover:bg-blue-700 disabled:bg-slate-600 disabled:border-slate-700 disabled:cursor-not-allowed transition-all transform active:translate-y-1 disabled:transform-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
                },
                    isLoading ? (
                        React.createElement('div', { className: "w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" })
                    ) : (
                        React.createElement(WandIcon)
                    ),
                    React.createElement('span', { className: "text-lg" }, isLoading ? `Đang tạo ${numberOfResults} kết quả...` : 'Tạo Nội dung')
                )
            )
        )
    );
};

const AppAffiliate = ({ geminiApiKey, openaiApiKey, selectedAIModel }) => {
    const [modelImage, setModelImage] = useState<UploadedImage | null>(null);
    const [productImage, setProductImage] = useState<UploadedImage | null>(null);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generationMode, setGenerationMode] = useState('product'); 
    const [voice, setVoice] = useState('female');
    const [region, setRegion] = useState('south');
    const [numberOfResults, setNumberOfResults] = useState(1);
    const [outfitSuggestion, setOutfitSuggestion] = useState('');
    const [backgroundSuggestion, setBackgroundSuggestion] = useState('');
    const [productInfo, setProductInfo] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    
    const isGpt = selectedAIModel === 'gpt';

    useEffect(() => {
        if (generationMode === 'fashion') {
            setOutfitSuggestion('');
        }
    }, [generationMode]);

    const handleGenerateContent = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
    
        // Image-based path
        if (modelImage && productImage) {
            if (isGpt) {
                setError('Tính năng ghép ảnh người mẫu và sản phẩm chỉ được hỗ trợ bởi Gemini. Vui lòng chọn model Gemini để sử dụng.');
                setIsLoading(false);
                return;
            }
            if (!geminiApiKey) {
                setError('Vui lòng cài đặt API Key Gemini trước khi tạo.');
                setIsLoading(false);
                return;
            }
            
            try {
                const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
                const generatedResults = await generateAllContent(
                    ai,
                    modelImage.base64,
                    productImage.base64,
                    voice,
                    region,
                    numberOfResults,
                    generationMode,
                    outfitSuggestion,
                    backgroundSuggestion,
                    productInfo
                );
                setResults(generatedResults.map((res, index) => ({ ...res, id: `result-${index}-${Date.now()}` })));
            } catch (err) {
                 let errorMessage = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
                 if (err instanceof Error) {
                     const msg = err.message.toLowerCase();
                     if (msg.includes('quota') || msg.includes('429') || msg.includes('resource_exhausted')) {
                         errorMessage = `<strong>Lỗi: Đã vượt quá hạn ngạch sử dụng</strong><p class="mt-2">Bạn đã đạt đến giới hạn sử dụng của Gemini API. Hãy thử lại sau hoặc giảm số lượng kết quả.</p>`;
                     } else if (msg.includes('api key not valid') || msg.includes('400')) {
                         errorMessage = '<strong>Lỗi API:</strong> API key không hợp lệ hoặc môi trường Google AI Studio chưa được cấu hình đúng.';
                     } else {
                         errorMessage = `<strong>Đã xảy ra lỗi:</strong><pre class="mt-2 text-left whitespace-pre-wrap">${err.message}</pre>`;
                     }
                 }
                 setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        } 
        // Text-only path
        else if (!modelImage && !productImage) {
            if (!productInfo && !backgroundSuggestion && !outfitSuggestion) {
                setError('Vui lòng nhập thông tin sản phẩm hoặc gợi ý để tạo ảnh từ văn bản.');
                setIsLoading(false);
                return;
            }
    
            try {
                if(isGpt) {
                    if (!openaiApiKey) {
                        throw new Error('Vui lòng cài đặt API Key OpenAI trước khi tạo.');
                    }
                    const textGenPromises = Array.from({ length: numberOfResults }, (_, i) => {
                        const constructedPrompt = `
                            Create a single, high-resolution, photorealistic promotional image.
                            Style: high-end, polished, suitable for professional advertisement.
                            Product information: ${productInfo || 'Not specified'}.
                            Outfit suggestion: ${outfitSuggestion || 'Stylish and contextually appropriate'}.
                            Background suggestion: ${backgroundSuggestion || 'Dynamic and interesting studio setting'}.
                            A person should be featured interacting with the product naturally.
                            The image must NOT contain any text.
                            Seed: ${i}.
                        `;
                        const sizeMap = { '16:9': '1792x1024', '9:16': '1024x1792', '1:1': '1024x1024' };
                        
                        return fetch('https://api.openai.com/v1/images/generations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                            body: JSON.stringify({
                                model: 'dall-e-3', prompt: constructedPrompt, n: 1, size: sizeMap[aspectRatio] || '1024x1024',
                                response_format: 'b64_json', quality: 'hd', style: 'vivid'
                            })
                        }).then(async response => {
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(`OpenAI DALL-E Error: ${errorData.error.message}`);
                            }
                            return response.json();
                        }).then(data => {
                            const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
                            return {
                                id: `result-text-openai-${i}-${Date.now()}`,
                                imageUrl: imageUrl,
                                promptSets: [{ description: constructedPrompt, animationPrompt: null }]
                            };
                        });
                    });
                     const generatedResults = await Promise.all(textGenPromises);
                     setResults(generatedResults);

                } else { // Gemini text-only
                     if (!geminiApiKey) {
                        throw new Error('Vui lòng cài đặt API Key Gemini trước khi tạo.');
                    }
                    const ai = new window.GoogleGenAI({ apiKey: geminiApiKey });
                    const textGenPromises = Array.from({ length: numberOfResults }, (_, i) => {
                        const constructedPrompt = `
                            Create a single, high-resolution, photorealistic promotional image.
                            Style: high-end, polished, suitable for professional advertisement.
                            Product information: ${productInfo || 'Not specified'}.
                            Outfit suggestion: ${outfitSuggestion || 'Stylish and contextually appropriate'}.
                            Background suggestion: ${backgroundSuggestion || 'Dynamic and interesting studio setting'}.
                            A person should be featured interacting with the product naturally.
                            The image must NOT contain any text.
                            Seed: ${i}.
                        `;
                        return ai.models.generateImages({
                            model: 'imagen-4.0-generate-001',
                            prompt: constructedPrompt,
                            config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: aspectRatio },
                        }).then(response => {
                            if (!response.generatedImages?.[0]?.image?.imageBytes) {
                                throw new Error(`Image generation failed for result ${i+1}.`);
                            }
                            const imageUrl = `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
                            return {
                                id: `result-text-gemini-${i}-${Date.now()}`,
                                imageUrl: imageUrl,
                                promptSets: [{ description: constructedPrompt, animationPrompt: null }]
                            };
                        });
                    });
                    const generatedResults = await Promise.all(textGenPromises);
                    setResults(generatedResults);
                }
            } catch (err) {
                 let errorMessage = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
                 if (err instanceof Error) {
                     const msg = err.message.toLowerCase();
                     if (msg.includes('quota') || msg.includes('429') || msg.includes('resource_exhausted')) {
                         errorMessage = `<strong>Lỗi: Đã vượt quá hạn ngạch sử dụng</strong><p class="mt-2">Bạn đã đạt đến giới hạn sử dụng của API. Hãy thử lại sau hoặc giảm số lượng kết quả.</p>`;
                     } else if (msg.includes('api key not valid') || msg.includes('400')) {
                         errorMessage = '<strong>Lỗi API:</strong> API key không hợp lệ hoặc môi trường chưa được cấu hình đúng.';
                     } else {
                         errorMessage = `<strong>Đã xảy ra lỗi:</strong><pre class="mt-2 text-left whitespace-pre-wrap">${err.message}</pre>`;
                     }
                 }
                 setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        } 
        // Incomplete input path
        else {
            setError('Vui lòng tải lên CẢ hai ảnh, hoặc không tải ảnh nào để tạo từ văn bản.');
            setIsLoading(false);
        }
    }, [geminiApiKey, openaiApiKey, selectedAIModel, modelImage, productImage, voice, region, numberOfResults, generationMode, outfitSuggestion, backgroundSuggestion, productInfo, aspectRatio]);
    
    
    const ResultsPanel = () => (
        React.createElement('div', { className: "w-full lg:w-2/3" },
            isLoading ? (
                React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    Array.from({ length: numberOfResults }).map((_, index) => (
                        React.createElement('div', { key: index, className: "bg-slate-800/50 border border-slate-700 rounded-xl p-4 min-h-[300px] flex flex-col justify-center" },
                            React.createElement(SkeletonLoader)
                        )
                    ))
                )
            ) : results.length > 0 ? (
                React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6" },
                    results.map((result) => (
                        React.createElement(GeneratedContent, {
                            key: result.id,
                            image: result.imageUrl,
                            promptSets: result.promptSets,
                            isLoading: false
                        })
                    ))
                )
            ) : (
                 React.createElement('div', { className: "text-center text-slate-500 py-16 border-2 border-dashed border-slate-700 rounded-xl h-full flex flex-col items-center justify-center" },
                    React.createElement(SparklesIcon, { className: "w-12 h-12" }),
                    React.createElement('p', { className: "mt-2" }, "Kết quả của bạn sẽ xuất hiện ở đây.")
                 )
            ),
            error && (
                React.createElement('div', {
                    className: "mt-4 w-full p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-center",
                    dangerouslySetInnerHTML: { __html: error }
                })
            )
        )
    );

    const controlPanelProps = {
        generationMode, setGenerationMode,
        voice, setVoice,
        region, setRegion,
        numberOfResults, setNumberOfResults,
        outfitSuggestion, setOutfitSuggestion,
        backgroundSuggestion, setBackgroundSuggestion,
        productInfo, setProductInfo,
        setModelImage, setProductImage,
        handleGenerateContent,
        modelImage, productImage, isLoading,
        aspectRatio, setAspectRatio,
        isGpt
    };

    return (
        React.createElement('div', { className: "min-h-full w-full flex flex-col p-4 font-sans" },
            React.createElement('main', { className: "flex flex-col lg:flex-row gap-8 w-full h-full" },
                React.createElement(ControlPanel, controlPanelProps),
                React.createElement(ResultsPanel)
            )
        )
    );
};

export default AppAffiliate;
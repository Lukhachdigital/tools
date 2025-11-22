import React, { useState, useCallback } from 'react';

// =================================================================
// TYPES
// =================================================================
interface SEOContent {
  description: string; // Changed from string[] to string
  hashtags: string[];
  primaryKeywords: string[];
  secondaryKeywords: string[];
}

// =================================================================
// HELPER COMPONENTS
// =================================================================

const LoadingSpinner = () => {
  return React.createElement('svg', {
    className: "animate-spin h-5 w-5 text-white",
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24"
  },
    React.createElement('circle', {
      className: "opacity-25",
      cx: "12",
      cy: "12",
      r: "10",
      stroke: "currentColor",
      strokeWidth: "4"
    }),
    React.createElement('path', {
      className: "opacity-75",
      fill: "currentColor",
      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    })
  );
};

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  }, [textToCopy]);

  const buttonClass = `absolute top-2 right-2 px-3 py-1 text-xs rounded-md transition-colors duration-200 ${
    isCopied
      ? 'bg-green-600 text-white'
      : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
  }`;

  return React.createElement('button', { onClick: handleCopy, className: buttonClass },
    isCopied ? 
      React.createElement(React.Fragment, null, React.createElement('i', { className: "fas fa-check mr-1" }), 'Đã sao chép') : 
      React.createElement(React.Fragment, null, React.createElement('i', { className: "fas fa-copy mr-1" }), 'Sao chép')
  );
};


// =================================================================
// GENERATION SERVICES
// =================================================================

const generateTitles = async (description: string, geminiKey: string, openaiKey: string, openRouterKey: string, lengthConstraint: string | null, selectedModel: string): Promise<string[]> => {
    let lengthInstruction = "Các tiêu đề phải có độ dài tối đa 100 ký tự";
    if (lengthConstraint) {
        if (lengthConstraint === "Trên 100") {
            lengthInstruction = `Các tiêu đề phải có độ dài TRÊN 100 ký tự`;
        } else {
            const [min, max] = lengthConstraint.split('-');
            lengthInstruction = `Các tiêu đề phải có độ dài từ ${min} đến ${max} ký tự`;
        }
    }

    const systemPrompt = `Bạn là một chuyên gia SEO YouTube và bậc thầy sáng tạo nội dung (Clickbait Expert) với khả năng tạo ra các tiêu đề lan truyền (Viral Titles).
    Phân tích ngôn ngữ của mô tả video sau. Bằng chính ngôn ngữ đó và đảm bảo ngữ pháp hoàn toàn chính xác, hãy tạo ra 5 tiêu đề ĐỈNH CAO, cực kỳ thu hút.
    
    **YÊU CẦU QUAN TRỌNG:**
    1.  **Tối đa hóa sự tò mò (High Curiosity):** Tiêu đề phải tạo ra "khoảng trống tò mò" (curiosity gap) khiến người xem không thể không bấm vào. Sử dụng các từ ngữ mạnh (Power Words), gây sốc nhẹ, cảm xúc mạnh hoặc hứa hẹn một bí mật/giải pháp bất ngờ. Hook phải thật sắc bén.
    2.  **Đa dạng & Sáng tạo (High Variance):** 5 tiêu đề phải có 5 góc nhìn/cấu trúc hoàn toàn khác nhau. TRÁNH lặp lại công thức. KHÔNG được giống với các lần tạo trước. Hãy suy nghĩ vượt khuôn khổ (Think outside the box).
    3.  **Không sử dụng năm (No Year):** TUYỆT ĐỐI KHÔNG đưa năm cụ thể (ví dụ: 2024, 2025...) vào tiêu đề trừ khi mô tả video yêu cầu rõ ràng về báo cáo năm. Hãy tập trung vào giá trị cốt lõi để video luôn hợp thời (evergreen).
    4.  **Kỹ thuật Hook:** Sử dụng câu hỏi tu từ, phủ định (Đừng làm X trước khi biết Y), con số cụ thể, hoặc sự so sánh đối lập để tăng CTR.
    5.  **Độ dài:** ${lengthInstruction}.

    Mô tả video: "${description}"`;

    // Fallback Chain: Gemini -> OpenAI -> OpenRouter
    let finalError;

    // 1. Try Gemini
    if (selectedModel === 'gemini' || (selectedModel === 'auto' && geminiKey)) {
        try {
            if (!geminiKey && selectedModel === 'gemini') throw new Error("Gemini Key missing");
            const ai = new window.GoogleGenAI({ apiKey: geminiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
                config: {
                    temperature: 1.2,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: window.GenAIType.OBJECT,
                        properties: { titles: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } } }
                    }
                }
            });
            return JSON.parse(response.text).titles || [];
        } catch (e) {
            console.warn('Gemini failed', e);
            if (selectedModel === 'gemini') throw e;
            finalError = e;
        }
    }

    // 2. Try OpenAI
    if (selectedModel === 'openai' || (selectedModel === 'auto' && openaiKey)) {
        try {
            if (!openaiKey && selectedModel === 'openai') throw new Error("OpenAI Key missing");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Trả về kết quả dưới dạng một đối tượng JSON có một khóa duy nhất là "titles", chứa một mảng gồm 5 chuỗi tiêu đề.' }],
                    response_format: { type: 'json_object' },
                    temperature: 1.0
                })
            });
            if (!response.ok) throw new Error('OpenAI failed');
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content).titles || [];
        } catch (e) {
            console.warn('OpenAI failed', e);
            if (selectedModel === 'openai') throw e;
            finalError = e;
        }
    }

    // 3. Try OpenRouter
    if (selectedModel === 'openrouter' || (selectedModel === 'auto' && openRouterKey)) {
        try {
            if (!openRouterKey && selectedModel === 'openrouter') throw new Error("OpenRouter Key missing");
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openRouterKey}` },
                body: JSON.stringify({
                    model: 'google/gemini-2.5-pro',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Trả về kết quả dưới dạng một đối tượng JSON có một khóa duy nhất là "titles", chứa một mảng gồm 5 chuỗi tiêu đề.' }],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenRouter failed');
            const data = await response.json();
            const parsed = JSON.parse(data.choices[0].message.content);
            return parsed.titles || [];
        } catch (e) {
            console.warn('OpenRouter failed', e);
            if (selectedModel === 'openrouter') throw e;
            finalError = e;
        }
    }

    throw finalError || new Error("All providers failed");
};

const generateFullSEOContent = async (description: string, title: string, geminiKey: string, openaiKey: string, openRouterKey: string, descStyle: string | null, selectedModel: string): Promise<SEOContent> => {
    const styleMap = { 'Ngắn gọn': 'khoảng 80-120 từ', 'Vừa phải': 'khoảng 120-160 từ', 'Tiêu chuẩn': 'khoảng 160-220 từ', 'Dài': 'khoảng 220-300 từ' };
    const lengthInstruction = descStyle ? `Độ dài yêu cầu: ${styleMap[descStyle]}.` : 'Độ dài khoảng 160-220 từ.';
    
    const systemPrompt = `Bạn là một chuyên gia SEO YouTube và chuyên gia sáng tạo nội dung. Dựa vào mô tả video và tiêu đề đã chọn, hãy tạo ra nội dung SEO tối ưu. Phân tích ngôn ngữ của đầu vào và trả lời bằng chính ngôn ngữ đó với ngữ pháp hoàn hảo.
    
    Mô tả video gốc: "${description}"
    Tiêu đề đã chọn: "${title}"

    **YÊU CẦU QUAN TRỌNG:**
    1.  **Sáng tạo & Độc đáo:** Đối với mỗi yêu cầu mới, ngay cả với cùng một đầu vào, bạn BẮT BUỘC phải tạo ra một bộ mô tả và từ khóa hoàn toàn mới và khác biệt. Hãy tư duy sáng tạo để diễn đạt ý tưởng theo nhiều cách khác nhau.
    2.  **Tính bền vững (Evergreen):** Nội dung phải có giá trị lâu dài. TRÁNH đề cập đến năm cụ thể (như 2024, 2025) để video không bị lỗi thời, trừ khi chủ đề bắt buộc.

    **CẤU TRÚC NỘI DUNG:**
    1.  **description:** Viết MỘT ĐOẠN VĂN mô tả chuẩn SEO, tự nhiên và liền mạch. ${lengthInstruction}
        -   **QUAN TRỌNG:** Trong 1-2 câu đầu tiên, hãy viết một đoạn mở đầu (hook) thật hấp dẫn để giữ chân người xem.
        -   Sử dụng lối kể chuyện (storytelling) nếu phù hợp để làm cho nội dung trở nên lôi cuốn.
        -   Cấu trúc mô tả thành các câu hoặc đoạn văn ngắn. Sau mỗi câu hoặc đoạn văn, hãy xuống dòng hai lần để tạo khoảng cách, giúp người đọc dễ theo dõi.
        -   Nội dung phải tập trung vào chủ đề video và từ khóa, **KHÔNG** có lời kêu gọi hành động (CTA) và tránh dùng đại từ 'chúng tôi'. Văn phong phải tự nhiên, không nhồi nhét từ khóa máy móc.
        -   Chỉ sử dụng 1-2 emoji phù hợp trong toàn bộ đoạn văn để tạo điểm nhấn, không bắt đầu mỗi câu bằng emoji.
    2.  **hashtags:** Viết 3 hashtag **liên quan mật thiết và trực tiếp nhất** đến nội dung video. Sau đó, **BẮT BUỘC** thêm 3 hashtag sau vào cuối: #lamyoutubeai, #huynhxuyenson, #huongdanai. Tổng cộng là 6 hashtag. Hashtag phải không dấu, viết bằng chữ thường, và viết liền. **QUAN TRỌNG:** Mỗi hashtag trong mảng kết quả BẮT BUỘC phải bắt đầu bằng ký tự '#'.
    3.  **primaryKeywords:** Liệt kê 8 từ khóa **quan trọng và cốt lõi nhất**.
    4.  **secondaryKeywords:** Liệt kê 15 từ khóa phụ mở rộng, **tập trung vào các khía cạnh cụ thể** của video.`;

    // Fallback Chain: Gemini -> OpenAI -> OpenRouter
    let finalError;

    // 1. Try Gemini
    if (selectedModel === 'gemini' || (selectedModel === 'auto' && geminiKey)) {
        try {
            if (!geminiKey && selectedModel === 'gemini') throw new Error("Gemini Key missing");
            const ai = new window.GoogleGenAI({ apiKey: geminiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: window.GenAIType.OBJECT,
                        properties: {
                            description: { type: window.GenAIType.STRING },
                            hashtags: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } },
                            primaryKeywords: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } },
                            secondaryKeywords: { type: window.GenAIType.ARRAY, items: { type: window.GenAIType.STRING } },
                        },
                        required: ["description", "hashtags", "primaryKeywords", "secondaryKeywords"]
                    }
                }
            });
            return JSON.parse(response.text);
        } catch (e) {
            console.warn('Gemini failed', e);
            if (selectedModel === 'gemini') throw e;
            finalError = e;
        }
    }

    // 2. Try OpenAI
    if (selectedModel === 'openai' || (selectedModel === 'auto' && openaiKey)) {
        try {
            if (!openaiKey && selectedModel === 'openai') throw new Error("OpenAI Key missing");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Hãy trả về kết quả dưới dạng một đối tượng JSON có cấu trúc chính xác như sau: { "description": "...", "hashtags": ["...", "..."], "primaryKeywords": ["...", "..."], "secondaryKeywords": ["...", "..."] }' }],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenAI failed');
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.warn('OpenAI failed', e);
            if (selectedModel === 'openai') throw e;
            finalError = e;
        }
    }

    // 3. Try OpenRouter
    if (selectedModel === 'openrouter' || (selectedModel === 'auto' && openRouterKey)) {
        try {
            if (!openRouterKey && selectedModel === 'openrouter') throw new Error("OpenRouter Key missing");
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openRouterKey}` },
                body: JSON.stringify({
                    model: 'google/gemini-2.5-pro',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Hãy trả về kết quả dưới dạng một đối tượng JSON có cấu trúc chính xác như sau: { "description": "...", "hashtags": ["...", "..."], "primaryKeywords": ["...", "..."], "secondaryKeywords": ["...", "..."] }' }],
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) throw new Error('OpenRouter failed');
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.warn('OpenRouter failed', e);
            if (selectedModel === 'openrouter') throw e;
            finalError = e;
        }
    }

    throw finalError || new Error("All providers failed");
};

// =================================================================
// MAIN APP COMPONENT
// =================================================================

const SeoYoutubeApp = ({ geminiApiKey, openaiApiKey, openRouterApiKey, selectedAIModel }) => {
  const [videoDescription, setVideoDescription] = useState('');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [seoContent, setSeoContent] = useState<SEOContent | null>(null);
  const [isLoadingTitles, setIsLoadingTitles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitleLength, setSelectedTitleLength] = useState<string | null>(null);
  const [selectedDescStyle, setSelectedDescStyle] = useState<string | null>('Tiêu chuẩn');
  const [copiedAll, setCopiedAll] = useState(false);
  
  const handleGenerateTitles = useCallback(async () => {
    if (!geminiApiKey && !openaiApiKey && !openRouterApiKey) {
      setError('Vui lòng vào "Cài đặt API Key" để thêm ít nhất một key.');
      return;
    }
    if (!videoDescription.trim()) {
      setError('Vui lòng nhập mô tả video.');
      return;
    }
    setError(null);
    setIsLoadingTitles(true);
    setSuggestedTitles([]);
    setSelectedTitle(null);
    setSeoContent(null);
    setCopiedAll(false);

    try {
      const titles = await generateTitles(videoDescription, geminiApiKey, openaiApiKey, openRouterApiKey, selectedTitleLength, selectedAIModel);
      setSuggestedTitles(titles);
    } catch (err: any) {
      setError("Không thể tạo tiêu đề: " + err.message);
    } finally {
      setIsLoadingTitles(false);
    }
  }, [videoDescription, geminiApiKey, openaiApiKey, openRouterApiKey, selectedTitleLength, selectedAIModel]);

  const handleGenerateContent = useCallback(async (title: string) => {
    if (!geminiApiKey && !openaiApiKey && !openRouterApiKey) {
        setError('Vui lòng vào "Cài đặt API Key" để thêm ít nhất một key.');
        return;
    }
    setSelectedTitle(title);
    setIsLoadingContent(true);
    setSeoContent(null);
    setError(null);
    setCopiedAll(false);

    try {
      const content = await generateFullSEOContent(videoDescription, title, geminiApiKey, openaiApiKey, openRouterApiKey, selectedDescStyle, selectedAIModel);
      setSeoContent(content);
    } catch (err: any)
    {
      setError("Không thể tạo nội dung SEO: " + err.message);
    } finally {
      setIsLoadingContent(false);
    }
  }, [videoDescription, geminiApiKey, openaiApiKey, openRouterApiKey, selectedDescStyle, selectedAIModel]);

  const handleCopyAll = () => {
      if (!seoContent || !selectedTitle) return;
      
      // Simple text copy without headers or explanations as requested, each part separated by 2 empty lines
      const allText = `${selectedTitle}\n\n\n${seoContent.description}\n\n\n${seoContent.hashtags.join(' ')}\n\n\n${seoContent.primaryKeywords.join(', ')}, ${seoContent.secondaryKeywords.join(', ')}`;
      
      navigator.clipboard.writeText(allText).then(() => {
          setCopiedAll(true);
      });
  };

  const renderSEOContent = () => {
    if (!selectedTitle || !seoContent) return null;

    const hashtagsText = seoContent.hashtags.join(' ');
    const allKeywords = [...seoContent.primaryKeywords, ...seoContent.secondaryKeywords];
    const keywordsText = allKeywords.join(', ');
    const descriptionText = seoContent.description;

    return React.createElement('div', { className: "space-y-6 animate-fade-in" },
      React.createElement('button', { 
          onClick: handleCopyAll,
          className: `w-full font-bold py-2 px-4 rounded-lg transition-colors shadow-md ${copiedAll ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`
      }, copiedAll ? "Đã sao chép tất cả" : "Sao chép toàn bộ"),
      React.createElement('div', { className: "bg-gray-800 p-4 rounded-lg shadow-lg relative" },
        React.createElement('h3', { className: "text-lg font-bold text-cyan-400 mb-2" }, "Tiêu đề đã chọn"),
        React.createElement('p', { className: "text-gray-200" }, selectedTitle),
        React.createElement(CopyButton, { textToCopy: selectedTitle })
      ),
      React.createElement('div', { className: "bg-gray-800 p-4 rounded-lg shadow-lg relative" },
        React.createElement('h3', { className: "text-lg font-bold text-cyan-400 mb-2" }, "Mô tả"),
        React.createElement('p', { className: "text-gray-300 whitespace-pre-wrap" }, descriptionText),
        React.createElement(CopyButton, { textToCopy: descriptionText })
      ),
      React.createElement('div', { className: "bg-gray-800 p-4 rounded-lg shadow-lg relative" },
        React.createElement('h3', { className: "text-lg font-bold text-cyan-400 mb-2" }, "Hashtag"),
        React.createElement('p', { className: "text-gray-300" }, hashtagsText),
        React.createElement(CopyButton, { textToCopy: hashtagsText })
      ),
      React.createElement('div', { className: "bg-gray-800 p-4 rounded-lg shadow-lg relative" },
        React.createElement('h3', { className: "text-lg font-bold text-cyan-400 mb-2" }, "Từ khóa (Keywords)"),
        React.createElement('p', { className: "text-gray-300 leading-relaxed" }, keywordsText),
        React.createElement(CopyButton, { textToCopy: keywordsText })
      )
    );
  };

  const titleLengthOptions = ["50-60", "60-70", "70-80", "80-90", "90-100", "Trên 100"];
  const descStyleOptions = ["Ngắn gọn", "Vừa phải", "Tiêu chuẩn", "Dài"];

  return (
    React.createElement('div', { className: "w-full h-full" },
        React.createElement('main', null,
          React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-5 gap-8" },
            // Left Column
            React.createElement('div', { className: "lg:col-span-2" },
              React.createElement('div', { className: "bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700 sticky top-8 space-y-6" },
                React.createElement('div', null,
                    React.createElement('label', { htmlFor: "description", className: "block text-lg font-semibold mb-2 text-cyan-300" }, "1. Nhập mô tả video"),
                    React.createElement('textarea', {
                    id: "description",
                    value: videoDescription,
                    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setVideoDescription(e.target.value),
                    placeholder: "Ví dụ: Hướng Dẫn Cách Tạo Video Trên VEO 3.1 Không Giới Hạn Thời Lượng",
                    className: "w-full h-28 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    })
                ),
                React.createElement('div', { className: "space-y-3" },
                  React.createElement('h3', { className: "text-md font-semibold text-cyan-300" }, "2. Tùy chỉnh Tiêu đề"),
                  React.createElement('div', { className: "grid grid-cols-3 gap-2" },
                      titleLengthOptions.map(opt => React.createElement('button', {
                          key: opt,
                          onClick: () => setSelectedTitleLength(opt),
                          disabled: isLoadingTitles,
                          className: `px-2 py-2 text-xs rounded-md transition-colors ${selectedTitleLength === opt ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`
                      }, opt))
                  )
                ),
                React.createElement('div', { className: "space-y-3" },
                  React.createElement('h3', { className: "text-md font-semibold text-cyan-300" }, "3. Tùy chỉnh Mô tả"),
                   React.createElement('div', { className: "grid grid-cols-2 gap-2" },
                      descStyleOptions.map(style => React.createElement('button', {
                          key: style,
                          onClick: () => setSelectedDescStyle(style),
                          className: `px-3 py-2 text-sm rounded-md transition-colors ${selectedDescStyle === style ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`
                      }, style))
                  )
                ),
                React.createElement('button', {
                  onClick: handleGenerateTitles,
                  disabled: isLoadingTitles,
                  className: "w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                },
                  isLoadingTitles ? React.createElement(LoadingSpinner, null) : React.createElement('i', { className: "fas fa-magic" }),
                  isLoadingTitles ? 'Đang tạo tiêu đề...' : '4. Tạo Gợi Ý Tiêu đề'
                )
              )
            ),
            // Right Column
            React.createElement('div', { className: "lg:col-span-3 space-y-8" },
              error && React.createElement('div', { className: "p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center" }, error),
              suggestedTitles.length > 0 && (
                React.createElement('div', { className: "bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700" },
                  React.createElement('h2', { className: "text-xl font-semibold mb-4 text-cyan-300" }, "5. Chọn một tiêu đề"),
                  React.createElement('div', { className: "space-y-3" },
                    suggestedTitles.map((title, index) => (
                      React.createElement('div', { key: index, className: "flex items-center justify-between bg-gray-900 p-3 rounded-md border border-gray-700" },
                        React.createElement('p', { className: "flex-grow mr-4" }, title),
                        React.createElement('button', {
                          onClick: () => handleGenerateContent(title),
                          disabled: isLoadingContent,
                          className: "flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500"
                        }, 'Chọn')
                      )
                    ))
                  )
                )
              ),
              isLoadingContent && (
                React.createElement('div', { className: "flex justify-center items-center gap-3 text-lg text-gray-300" },
                    React.createElement(LoadingSpinner, null),
                    React.createElement('span', null, 'Đang tối ưu hóa nội dung...')
                )
              ),
              renderSEOContent()
            )
          )
        )
    )
  );
};

export default SeoYoutubeApp;
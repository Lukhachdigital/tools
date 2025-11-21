
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Language {
    name: string;
    country: string;
    flag: string;
}

const LanguageButton = ({ language, selected, onClick }: { language: Language, selected: string[], onClick: (name: string) => void }) => {
    const isSelected = selected.includes(language.name);
    const buttonClasses = `
        flex items-center justify-center px-4 py-2 rounded-lg border-2 transition-all duration-200
        ${isSelected
            ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
            : 'bg-slate-800 border-slate-700 hover:border-slate-500'
        }
    `;
    return React.createElement('button', { onClick: () => onClick(language.name), className: buttonClasses },
        React.createElement('span', { className: `font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}` }, language.country)
    );
};

const ResultCard = ({ language, text }: { language: string, text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };

    return React.createElement('div', { className: "bg-slate-800 p-4 rounded-lg border border-slate-700" },
        React.createElement('div', { className: "flex justify-between items-center mb-2" },
            React.createElement('h3', { className: "font-semibold text-cyan-400" }, language),
            React.createElement('button', { onClick: handleCopy, className: 'text-sm text-slate-400 hover:text-white transition' }, copied ? 'Đã sao chép!' : 'Sao chép')
        ),
        React.createElement('p', { className: "text-white whitespace-pre-wrap" }, text)
    );
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const YoutubeExternalApp = ({ geminiApiKey, openaiApiKey, selectedAIModel }: { geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }): React.ReactElement => {
    const [text, setText] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
    const [results, setResults] = useState<{ language: string, translation: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [error, setError] = useState('');

    const languages = [
        { name: 'English', country: 'Hoa Kỳ', flag: '🇺🇸' },
        { name: 'Korean', country: 'Hàn Quốc', flag: '🇰🇷' },
        { name: 'Japanese', country: 'Nhật Bản', flag: '🇯🇵' },
        { name: 'German', country: 'Đức', flag: '🇩🇪' },
        { name: 'French', country: 'Pháp', flag: '🇫🇷' },
        { name: 'Russian', country: 'Nga', flag: '🇷🇺' },
        { name: 'Chinese', country: 'Trung Quốc', flag: '🇨🇳' },
        { name: 'Vietnamese', country: 'Việt Nam', flag: '🇻🇳' },
    ];

    const toggleLanguage = (langName: string) => {
        setSelectedLanguages(prev =>
            prev.includes(langName)
                ? prev.filter(l => l !== langName)
                : [...prev, langName]
        );
    };

    const handleTranslate = async () => {
        if (selectedAIModel === 'gemini' && !geminiApiKey) {
            setError('API Key Gemini chưa được cài đặt.');
            return;
        }
        if (selectedAIModel === 'gpt' && !openaiApiKey) {
            setError('API Key OpenAI chưa được cài đặt.');
            return;
        }

        if (!text) {
            setError('Vui lòng nhập văn bản cần dịch.');
            return;
        }
        if (selectedLanguages.length === 0) {
            setError('Vui lòng chọn ít nhất một ngôn ngữ để dịch.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResults([]);

        const commonPrompt = `Bạn là một chuyên gia dịch thuật với độ chính xác tuyệt đối.
        **Yêu cầu BẮT BUỘC và KHÔNG THAY ĐỔI:**
        1.  **Dịch Chính Xác:** Dịch toàn bộ nội dung sang ngôn ngữ đích.
        2.  **Bảo Toàn Ý Nghĩa:** Giữ nguyên 100% ý nghĩa và văn phong gốc.
        3.  **Bảo Toàn Cấu Trúc:** Giữ nguyên 100% cấu trúc của văn bản gốc, bao gồm tất cả các lần xuống dòng, khoảng trắng, và định dạng. Không được thêm, bớt hay thay đổi bất kỳ ký tự nào không phải là bản dịch.
        4.  **Dịch Hashtag:** Dịch nghĩa của các hashtag sang ngôn ngữ đích, trừ khi chúng là danh từ riêng (tên người, thương hiệu). Ví dụ: "#lamdep" phải được dịch, nhưng "#huynhxuyenson" giữ nguyên.
        5.  **Kết Quả Cuối Cùng:** Chỉ trả về văn bản đã dịch thuần túy. KHÔNG thêm bất kỳ lời giải thích, ghi chú, hay văn bản nào khác.

        Văn bản gốc:
        ---
        ${text}
        ---
        Bản dịch:`;

        try {
            const newResults: { language: string, translation: string }[] = [];
            
            // Process sequentially to avoid 429 errors
            for (const lang of selectedLanguages) {
                setLoadingStatus(`Đang dịch sang ${lang}...`);
                
                if (selectedAIModel === 'gemini') {
                    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                    const prompt = `Dịch đoạn văn bản sau đây sang ngôn ngữ ${lang}.\n${commonPrompt}`;
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });
                    newResults.push({ language: lang, translation: response.text || "" });
                } else { // OpenAI
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openaiApiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            messages: [
                                { role: 'system', content: `Bạn là một chuyên gia dịch thuật sang tiếng ${lang}.` },
                                { role: 'user', content: commonPrompt }
                            ]
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        if (response.status === 429) {
                             throw new Error("Hệ thống đang bận, vui lòng thử lại sau giây lát (Lỗi 429).");
                        }
                        throw new Error(`OpenAI Error for ${lang}: ${errorData.error?.message || response.statusText}`);
                    }
                    const data = await response.json();
                    newResults.push({ language: lang, translation: data.choices[0]?.message?.content || "" });
                }
                
                // Update results incrementally
                setResults([...newResults]);
                
                // Add a small delay between requests to respect rate limits
                await delay(1000);
            }

        } catch (err: any) {
            console.error(err);
            let message = err.message || 'Đã xảy ra lỗi trong quá trình dịch.';
            if (message.includes('429') || message.toLowerCase().includes('quota')) {
                message = 'Hệ thống đang bận, vui lòng thử lại sau giây lát (Lỗi 429/Quota).';
            }
            setError(message);
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    };

    return (
        <div className="w-full h-full p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <div className="flex flex-col space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">1. Nhập nội dung</h3>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Nhập tiêu đề, mô tả video của bạn vào đây..."
                            className="w-full h-64 p-4 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                        />
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">2. Chọn ngôn ngữ</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            {languages.map(lang => (
                                <LanguageButton
                                    key={lang.name}
                                    language={lang}
                                    selected={selectedLanguages}
                                    onClick={toggleLanguage}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleTranslate}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {loadingStatus || 'Đang dịch...'}
                                </>
                            ) : (
                                '3. Dịch ngay'
                            )}
                        </button>
                        {error && (
                            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="flex flex-col space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg h-full">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Kết quả dịch</h3>
                        <div className="space-y-4 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                            {results.length > 0 ? (
                                results.map((res, index) => (
                                    <ResultCard key={index} language={res.language} text={res.translation} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <p>Kết quả dịch sẽ hiển thị ở đây.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YoutubeExternalApp;

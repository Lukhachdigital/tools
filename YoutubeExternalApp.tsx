import React, { useState } from 'react';

const LanguageButton = ({ language, selected, onClick }) => {
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

const ResultCard = ({ language, text }) => {
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


const YoutubeExternalApp = ({ apiKey }): React.ReactElement => {
    const [text, setText] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState(['English']);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
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

    const toggleLanguage = (langName) => {
        setSelectedLanguages(prev =>
            prev.includes(langName)
                ? prev.filter(l => l !== langName)
                : [...prev, langName]
        );
    };

    const handleTranslate = async () => {
        if (!apiKey) {
            setError('API Key chưa được cài đặt.');
            return;
        }
        const ai = new window.GoogleGenAI({ apiKey });

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

        try {
            const translationPromises = selectedLanguages.map(async (lang) => {
                const prompt = `Bạn là một chuyên gia dịch thuật. Dịch đoạn văn bản sau đây sang ngôn ngữ ${lang}.
                **Yêu cầu quan trọng:**
                1.  Giữ nguyên ý nghĩa và văn phong gốc.
                2.  Dịch toàn bộ nội dung, bao gồm cả các hashtag.
                3.  Đối với hashtag, nếu chúng chứa danh từ riêng (ví dụ: tên người, tên thương hiệu), hãy giữ nguyên danh từ riêng đó. Ví dụ: hashtag "#huynhxuyenson" giữ nguyên, nhưng hashtag "#lamdep" phải được dịch sang ngôn ngữ đích.

                Văn bản gốc:
                ---
                ${text}
                ---
                Bản dịch:`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                return { language: lang, translation: response.text };
            });

            const newResults = await Promise.all(translationPromises);
            setResults(newResults);

        } catch (e) {
            console.error(e);
            setError('Không thể dịch văn bản. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const textareaProps = {
        id: 'text-to-translate',
        value: text,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
        rows: 8,
        className: "w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition",
        placeholder: "Nhập tiêu đề, mô tả hoặc kịch bản vào đây..."
    };

    return React.createElement('div', { className: 'w-full h-full flex flex-col p-4' },
        React.createElement('main', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow' },
            React.createElement('div', { className: 'bg-slate-900/50 p-6 rounded-2xl border border-slate-700 space-y-6' },
                React.createElement('div', null,
                    React.createElement('label', { htmlFor: 'text-to-translate', className: "block text-lg font-semibold text-cyan-300 mb-2" }, 'Văn bản gốc'),
                    React.createElement('textarea', textareaProps)
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-lg font-semibold text-cyan-300 mb-3" }, 'Dịch sang ngôn ngữ'),
                    React.createElement('div', { className: "flex flex-wrap gap-3 justify-center" },
                        languages.map(lang => React.createElement(LanguageButton, {
                            key: lang.name,
                            language: lang,
                            selected: selectedLanguages,
                            onClick: toggleLanguage
                        }))
                    )
                ),
                React.createElement('button', {
                    onClick: handleTranslate,
                    disabled: isLoading || !text || selectedLanguages.length === 0,
                    className: "w-full text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                }, isLoading ? 'Đang dịch...' : 'Dịch')
            ),
            React.createElement('div', { className: 'bg-slate-900/50 p-6 rounded-2xl border border-slate-700' },
                React.createElement('h2', { className: 'text-lg font-semibold text-cyan-300 mb-2' }, 'Kết quả'),
                error && React.createElement('div', { className: 'text-red-400 bg-red-900/50 p-3 rounded-lg mb-4' }, error),
                React.createElement('div', { className: 'w-full h-full space-y-4 overflow-auto' },
                    isLoading
                        ? React.createElement('div', { className: 'flex items-center justify-center h-full text-slate-400' }, 'Đang chờ kết quả...')
                        : results.length > 0
                            ? results.map(res => React.createElement(ResultCard, { key: res.language, language: res.language, text: res.translation }))
                            : React.createElement('p', { className: 'text-slate-500 text-center pt-8' }, 'Bản dịch sẽ hiển thị ở đây.')
                )
            )
        )
    );
};

export default YoutubeExternalApp;

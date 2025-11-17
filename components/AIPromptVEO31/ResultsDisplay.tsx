import React, { useState } from 'react';
import type { ScriptResponse } from '../../types/veo31';

const CopyButton: React.FC<{ text: string, className?: string }> = ({ text, className = '' }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            onClick={handleCopy}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${copied ? 'bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'} ${className}`}
        >
            {copied ? 'Đã chép!' : 'Sao chép'}
        </button>
    );
};

const ResultsDisplay: React.FC<{ data: ScriptResponse }> = ({ data }) => {

    const handleDownload = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const downloadPromptsOnly = () => {
        const scriptContent = data.script.join('\n\n');
        handleDownload(scriptContent, 'veo3_prompts.txt');
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={downloadPromptsOnly} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Tải xuống Prompts (.txt)</button>
            </div>
            
            {/* Script Section */}
            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-500/30 pb-2">Kịch bản & Prompts</h2>
                <div className="space-y-4">
                    {data.script.map((prompt, index) => (
                        <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-2">Cảnh {index + 1}</h3>
                             <div className="relative bg-slate-900 p-3 rounded-md">
                                <pre className="text-sm text-amber-300 whitespace-pre-wrap break-words font-mono text-xs">{prompt}</pre>
                                <CopyButton text={prompt} className="absolute top-2 right-2"/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResultsDisplay;
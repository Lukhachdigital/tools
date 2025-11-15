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
    
    const downloadFullScript = () => {
        const characterInfo = data.characterAnalysis.map(char => 
            `Tên nhân vật: ${char.name}\nMô tả: ${char.description}\nGiọng nói: ${char.voice}`
        ).join('\n\n---\n\n');

        const scriptInfo = data.script.map((p, i) => `Cảnh ${i + 1}:\n${p}`).join('\n\n');

        const fullContent = `=== PHÂN TÍCH NHÂN VẬT ===\n\n${characterInfo}\n\n\n=== KỊCH BẢN ===\n\n${scriptInfo}`;
        handleDownload(fullContent, 'veo3_full_script.txt');
    };
    
    const downloadPromptsOnly = () => {
        const scriptContent = data.script.join('\n\n');
        handleDownload(scriptContent, 'veo3_prompts.txt');
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={downloadFullScript} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Tải Kịch bản (.txt)</button>
                <button onClick={downloadPromptsOnly} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">Tải Prompts (.txt)</button>
            </div>
            
            {/* Character Analysis Section */}
            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-500/30 pb-2">Phân tích Nhân vật</h2>
                <div className="space-y-4">
                    {data.characterAnalysis.map((char, index) => (
                        <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3">
                            <h3 className="text-lg font-semibold text-white">{char.name}</h3>
                            
                            <div className="relative bg-slate-900 p-3 rounded-md">
                                <label className="text-xs font-semibold text-slate-400">Mô tả (Description):</label>
                                <p className="text-sm text-slate-300 pr-20 break-words mt-1">{char.description}</p>
                                <CopyButton text={char.description} className="absolute top-2 right-2"/>
                            </div>
                            
                            <div className="relative bg-slate-900 p-3 rounded-md">
                                <label className="text-xs font-semibold text-slate-400">Giọng nói (Voice):</label>
                                <p className="text-sm text-slate-300 pr-20 break-words mt-1">{char.voice}</p>
                                <CopyButton text={char.voice} className="absolute top-2 right-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Script Section */}
            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-500/30 pb-2">Kịch bản</h2>
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
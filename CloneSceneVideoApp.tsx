import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// --- Types ---
interface SceneAnalysis {
    timeframe: string;
    context: string;
    character: string;
    action: string;
    emotion: string;
    fullDescription: string;
}

interface AnalysisResult {
    unique_characters: string[];
    scenes: SceneAnalysis[];
}

interface AnalysisState {
    isLoading: boolean;
    error: string | null;
    data: AnalysisResult | null;
}

enum AnalysisMode {
    FILE_UPLOAD = 'FILE_UPLOAD',
    YOUTUBE_URL = 'YOUTUBE_URL'
}

// --- Icons ---
const Icons = {
  Lock: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  Unlock: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  XMark: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Upload: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  Wand: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l1.183.394-1.183.394a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  Clipboard: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>,
  Check: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  Alert: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
};

// --- Password Protection Component ---
const PasswordProtection = ({ onUnlock, onClose }: { onUnlock: () => void, onClose: () => void }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'clonevideo') {
            onUnlock();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 p-8 rounded-2xl border border-cyan-500/30 shadow-2xl max-w-md w-full flex flex-col items-center relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-cyan-600/5 rotate-45 pointer-events-none" />
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6 border border-slate-600 shadow-inner">
                    <Icons.Lock className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2 uppercase tracking-wide text-center">Bảo Mật Ứng Dụng</h2>
                <p className="text-slate-400 text-sm mb-8 text-center px-4">Nhập mã truy cập để sử dụng tính năng Clone Video.</p>
                <form onSubmit={handleUnlock} className="w-full space-y-4 relative z-10">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mã truy cập..."
                            className={`w-full bg-slate-900 border ${error ? 'border-red-500 animate-shake' : 'border-slate-600 focus:border-cyan-500'} rounded-lg py-3 px-4 text-center text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 font-mono tracking-widest`}
                            autoFocus
                        />
                        {error && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"><Icons.XMark className="w-5 h-5"/></span>}
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform active:scale-95 shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 uppercase tracking-wide">
                        <Icons.Unlock className="w-5 h-5" /> Mở Khóa
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Scene Card ---
const SceneCard: React.FC<{ scene: SceneAnalysis; index: number }> = ({ scene, index }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(scene.fullDescription);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative pl-4 sm:pl-8 py-4 group">
            <div className="flex flex-col sm:flex-row items-start mb-1 gap-4">
                <div className="flex-shrink-0 w-24 flex items-center justify-center">
                   <div className="bg-slate-800 text-cyan-400 font-mono text-xs font-bold px-3 py-1 rounded-full border border-slate-700 shadow-sm">{scene.timeframe}</div>
                </div>
                <div className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all duration-300 shadow-lg relative group/prompt">
                    <div className="flex items-center justify-between mb-2">
                        <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold">Cảnh {index + 1}</span>
                        <button 
                            onClick={handleCopy} 
                            className={`p-1.5 rounded-md transition-all duration-200 border border-slate-700 ${copied ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-slate-800 text-slate-400 hover:bg-cyan-600 hover:text-white hover:border-cyan-500'}`}
                            title="Copy Prompt"
                        >
                            {copied ? <Icons.Check className="w-4 h-4" /> : <Icons.Clipboard className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">{scene.fullDescription}</div>
                </div>
            </div>
        </div>
    );
};

// --- Scene List ---
const SceneList: React.FC<{ data: AnalysisResult }> = ({ data }) => {
    const { scenes, unique_characters } = data;
    const handleDownloadAll = () => {
        const content = scenes.map(s => s.fullDescription).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prompts_export_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full max-w-5xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 sticky top-0 z-20 bg-slate-900/90 backdrop-blur py-4 border-b border-slate-800/50 -mt-6 pt-6 px-4 rounded-b-xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <Icons.Wand className="w-6 h-6 text-cyan-500" />
                     Kết Quả ({scenes.length} Cảnh)
                </h2>
                <button onClick={handleDownloadAll} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium rounded-lg transition-all shadow-md">
                    <Icons.Upload className="w-4 h-4 rotate-180 text-slate-300" />
                    Tải Tất Cả Prompt
                </button>
            </div>
            
            {unique_characters && unique_characters.length > 0 && (
                <div className="mb-8 px-4">
                   <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 bg-cyan-500 rounded-full"></span>
                          Dàn Nhân Vật (Clone)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unique_characters.map((char, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <div className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</div>
                            <span className="text-sm text-slate-200 font-medium leading-tight">{char}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
            )}
            <div className="px-2">
                {scenes.map((scene, index) => <SceneCard key={index} scene={scene} index={index} />)}
            </div>
        </div>
    );
};

// --- Video Uploader ---
const VideoUploader: React.FC<{ onAnalyze: (input: File | string, mode: AnalysisMode) => void; isLoading: boolean }> = ({ onAnalyze, isLoading }) => {
    const [activeTab, setActiveTab] = useState<AnalysisMode>(AnalysisMode.FILE_UPLOAD);
    const [url, setUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) onAnalyze(e.target.files[0], AnalysisMode.FILE_UPLOAD);
    };

    return (
        <div className="w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
            <div className="flex border-b border-slate-700">
                <button onClick={() => setActiveTab(AnalysisMode.FILE_UPLOAD)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === AnalysisMode.FILE_UPLOAD ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>Upload Video</button>
                <button onClick={() => setActiveTab(AnalysisMode.YOUTUBE_URL)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === AnalysisMode.YOUTUBE_URL ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>YouTube Link</button>
            </div>
            <div className="p-6">
                {activeTab === AnalysisMode.FILE_UPLOAD ? (
                    <div onClick={() => !isLoading && fileInputRef.current?.click()} className={`relative flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-600 bg-slate-900/50 rounded-xl transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-500 hover:bg-slate-800/50'}`}>
                        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />
                        <div className="text-center p-4">
                            <div className="w-12 h-12 mx-auto mb-3 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                                <Icons.Upload className="w-6 h-6 text-cyan-400" />
                            </div>
                            <p className="text-sm font-medium text-white mb-1">Kéo thả hoặc nhấn vào đây</p>
                            <p className="text-xs text-slate-500">Hỗ trợ MP4, MOV, AVI</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); if (url.trim()) onAnalyze(url, AnalysisMode.YOUTUBE_URL); }} className="flex flex-col gap-4 py-2">
                        <div className="relative">
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Dán link YouTube..." className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" disabled={isLoading} />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500">
                                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            </div>
                        </div>
                        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 flex items-start gap-2">
                            <Icons.Alert className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-200/80 leading-relaxed">Gemini có thể không xem trực tiếp được mọi link YouTube do bản quyền. Nên dùng <strong>Upload Video</strong> để chính xác nhất.</p>
                        </div>
                        <button type="submit" disabled={isLoading || !url} className="w-full py-3 rounded-lg text-sm font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95">
                            {isLoading ? 'Đang phân tích...' : 'Phân Tích'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- Main App Logic ---

const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        unique_characters: {
            type: Type.ARRAY,
            description: "Danh sách tổng hợp tất cả các nhân vật (phiên bản Clone) xuất hiện trong video.",
            items: { type: Type.STRING }
        },
        scenes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    timeframe: { type: Type.STRING, description: "Thời gian chính xác đến từng giây (ví dụ: 00:00 - 00:02)." },
                    context: { type: Type.STRING, description: "Bối cảnh môi trường xung quanh." },
                    character: { type: Type.STRING, description: "Mô tả nhân vật (biến đổi nhẹ để Clone)." },
                    action: { type: Type.STRING, description: "Hành động cụ thể đang diễn ra." },
                    emotion: { type: Type.STRING, description: "Cảm xúc hoặc trạng thái." },
                    fullDescription: { type: Type.STRING, description: "Prompt hoàn chỉnh: Bối cảnh + Nhân vật + Hành động + Cảm xúc." },
                },
                required: ["timeframe", "context", "character", "action", "emotion", "fullDescription"],
            },
        }
    },
    required: ["unique_characters", "scenes"]
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve({ inlineData: { data: base64Data, mimeType: file.type } });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const CloneSceneVideoApp: React.FC<{ geminiApiKey: string, openaiApiKey: string, selectedAIModel: string, onGoBack: () => void }> = ({ geminiApiKey, openaiApiKey, selectedAIModel, onGoBack }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [state, setState] = useState<AnalysisState>({ isLoading: false, error: null, data: null });

    const handleAnalyze = async (input: File | string, mode: AnalysisMode) => {
        // Enforce Gemini API Key requirement - User requested ONLY Gemini.
        if (!geminiApiKey) {
            setState({ isLoading: false, error: "Vui lòng cài đặt Gemini API Key trong phần Cài đặt để sử dụng tính năng này.", data: null });
            return;
        }

        setState({ isLoading: true, error: null, data: null });
        
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const modelId = "gemini-2.5-flash";
            const systemInstruction = `
                Bạn là một chuyên gia biên tập và phân tích video (Video Editor & Analyst) tỉ mỉ đến từng khung hình.
                Nhiệm vụ: Phân tích video và tạo prompt để tái tạo (clone) lại video đó, TUYỆT ĐỐI KHÔNG BỎ SÓT BẤT KỲ CẢNH NÀO.

                1. ĐỊNH NGHĨA "MỘT CẢNH": Mỗi khi máy quay thay đổi góc nhìn (Shot change) là 1 cảnh mới.
                2. NGUYÊN TẮC: Tôn trọng phong cách gốc (Realism/Animation).
                3. NHÂN VẬT: Biến đổi nhẹ (Clone) nhưng giữ đúng loài/bản chất.
                4. OUTPUT: Liệt kê nhân vật duy nhất và danh sách cảnh chi tiết.
            `;

            let contentParts: any[] = [];
            
            if (mode === AnalysisMode.FILE_UPLOAD && input instanceof File) {
                const videoPart = await fileToGenerativePart(input);
                contentParts = [videoPart, { text: "Hãy phân tích video này theo từng cú cắt máy (shot-by-shot). Đừng bỏ qua bất kỳ giây nào." }];
            } else {
                contentParts = [{ text: `Đây là đường dẫn video YouTube: ${input}. Hãy phân tích chi tiết từng cú cắt máy.` }];
            }

            const response = await ai.models.generateContent({
                model: modelId,
                contents: { role: "user", parts: contentParts },
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: analysisSchema,
                    temperature: 0.2,
                }
            });

            const textResponse = response.text;
            if (!textResponse) throw new Error("Không nhận được phản hồi từ AI.");
            const result = JSON.parse(textResponse) as AnalysisResult;
            setState({ isLoading: false, error: null, data: result });

        } catch (err: any) {
            console.error(err);
            let errorMessage = "Đã xảy ra lỗi khi phân tích video. Vui lòng thử lại.";
            if (err.message.includes("API key")) {
                errorMessage = "API Key không hợp lệ hoặc bị thiếu.";
            } else if (err.message.includes("400")) {
                errorMessage = "Dữ liệu không hợp lệ hoặc video quá lớn/định dạng không hỗ trợ.";
            }
            setState({ isLoading: false, error: errorMessage, data: null });
        }
    };

    return (
        <div className="relative w-full h-full p-4 flex flex-col bg-slate-900 text-slate-200 font-sans">
            
            {/* Password Overlay */}
            {!isUnlocked && (
                <PasswordProtection 
                    onUnlock={() => setIsUnlocked(true)} 
                    onClose={onGoBack}
                />
            )}

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-8 h-full">
                
                {/* Left Sidebar */}
                <aside className="w-full lg:w-1/3 flex-shrink-0 flex flex-col gap-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Icons.Wand className="w-6 h-6 text-cyan-400" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Phân Tích Video</span>
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed">Tải lên video hoặc dán liên kết để nhận diện bối cảnh, nhân vật, hành động và cảm xúc chi tiết từng cảnh.</p>
                        </div>
                        
                        <VideoUploader onAnalyze={handleAnalyze} isLoading={state.isLoading} />
                        
                        {state.isLoading && (
                            <div className="p-6 bg-slate-900/50 rounded-xl border border-cyan-500/20 animate-pulse text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent mb-3"></div>
                                <p className="text-cyan-400 font-medium text-sm">Đang xem và phân tích...</p>
                                <p className="text-slate-500 text-xs mt-1">Vui lòng đợi giây lát.</p>
                            </div>
                        )}
                        
                        {state.error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-300 text-sm">
                                <span className="mt-0.5">⚠️</span>
                                <span>{state.error}</span>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Content */}
                <main className="w-full lg:w-2/3 flex-grow bg-slate-900/50 rounded-2xl border border-slate-700 relative overflow-hidden flex flex-col">
                    {state.data ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                            <SceneList data={state.data} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40 select-none">
                            <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6">
                                <Icons.Wand className="w-10 h-10 text-slate-500" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-300 mb-2">Chưa có dữ liệu</h3>
                            <p className="text-slate-500 max-w-sm">Vui lòng tải video lên hoặc nhập link từ bảng điều khiển bên trái để bắt đầu phân tích.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CloneSceneVideoApp;
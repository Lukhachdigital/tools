
import React, { useState, useRef } from 'react';

// --- TYPES ---
export enum ThemeCategory {
  GIANT = "Khổng lồ (Giant/Surreal)",
  LUXURY = "Sang chảnh (Luxury Dining)",
  STREET = "Đường phố (Street Food)",
  COUNTRYSIDE = "Miền Quê (Countryside)",
  FUTURISTIC = "Tương lai (Futuristic)"
}

export type ProcessingState = 'idle' | 'analyzing' | 'success' | 'error';
export type OutfitMode = 'original' | 'auto' | 'sexy';
export type VoiceGender = 'male' | 'female';
export type VoiceAccent = 'north' | 'south';

export interface GeneratedScenario {
  title: string;
  imagePrompt: string;
  videoPrompt: string;
  description: string;
}

// --- UI COMPONENTS ---
const Button = ({ children, className = '', isLoading = false, variant = 'primary', ...props }: any) => {
  const baseStyles = "px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg";
  const variants: any = {
    primary: "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-orange-900/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    accent: "bg-indigo-600 hover:bg-indigo-700 text-white",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading && (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

const PromptCard = ({ index, scenario }: { index: number; scenario: GeneratedScenario }) => {
  const [copiedType, setCopiedType] = useState<'image' | 'video' | null>(null);

  const handleCopy = (text: string, type: 'image' | 'video') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden hover:border-orange-500/30 transition-all duration-300 shadow-xl">
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
            Part {index + 1}
          </div>
          <h3 className="font-bold text-lg text-white truncate">{scenario.title}</h3>
        </div>
        
        <p className="text-slate-400 italic text-sm bg-slate-900/80 p-4 rounded-xl border-l-4 border-orange-600 shadow-inner">
          "{scenario.description}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group/section">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Whisk AI Prompt (Image)
              </label>
              <button 
                onClick={() => handleCopy(scenario.imagePrompt, 'image')}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${copiedType === 'image' ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'}`}
              >
                {copiedType === 'image' ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Đã chép</> : 'Copy'}
              </button>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl text-xs text-slate-300 font-mono leading-relaxed select-all border border-slate-700 h-32 overflow-y-auto custom-scrollbar">
              {scenario.imagePrompt}
            </div>
          </div>

          <div className="group/section">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-bold text-pink-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Flow AI Prompt (Video)
              </label>
              <button 
                onClick={() => handleCopy(scenario.videoPrompt, 'video')}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${copiedType === 'video' ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'}`}
              >
                {copiedType === 'video' ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Đã chép</> : 'Copy'}
              </button>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl text-xs text-slate-300 font-mono leading-relaxed select-all border border-slate-700 h-32 overflow-y-auto custom-scrollbar">
              {scenario.videoPrompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const FoodReviewApp: React.FC<{ geminiApiKey: string, openaiApiKey: string, selectedAIModel: string }> = ({ geminiApiKey, openaiApiKey, selectedAIModel }) => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<ThemeCategory>(ThemeCategory.GIANT);
  const [outfitMode, setOutfitMode] = useState<OutfitMode>('auto');
  const [hasDialogue, setHasDialogue] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>('south');
  const [userIdea, setUserIdea] = useState("");
  
  const [scenarios, setScenarios] = useState<GeneratedScenario[]>([]);
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status for header buttons
  const [allWhiskCopied, setAllWhiskCopied] = useState(false);
  const [allFlowCopied, setAllFlowCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageBase64(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
      setScenarios([]);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!imageBase64) return setErrorMsg("Vui lòng tải ảnh khuôn mặt.");
    if (!userIdea.trim()) return setErrorMsg("Vui lòng nhập ý tưởng.");
    if (!geminiApiKey && !openaiApiKey) return setErrorMsg("Chưa cấu hình API Key.");

    setStatus('analyzing');
    setErrorMsg(null);
    setScenarios([]);
    
    const randomSeed = Math.random().toString(36).substring(7) + Date.now().toString().slice(-4);
    const isGiant = category === ThemeCategory.GIANT;
    const isSexy = outfitMode === 'sexy';

    let outfitInstruction = outfitMode === 'original' 
      ? "- TRANG PHỤC: Giữ nguyên bộ đồ trong ảnh gốc." 
      : `- TRANG PHỤC MỚI (Seed ${randomSeed}): Thiết kế bộ đồ ${isSexy ? 'gợi cảm, quyến rũ' : 'sành điệu, độc đáo'} khác hoàn toàn ảnh gốc.`;

    const promptText = `
      ROLE: Food Review Content Director.
      TASK: Tạo 8 phân cảnh liên kết (8 Parts) cho ý tưởng: "${userIdea}".
      THEME: ${category}.
      
      RULES CHO WHISK PROMPT (CỰC KỲ QUAN TRỌNG CHO TÍNH NHẤT QUÁN):
      - BẮT BUỘC: Mỗi imagePrompt (Whisk) PHẢI mô tả lại ĐẦY ĐỦ trang phục và bối cảnh chi tiết trong TẤT CẢ 8 Part.
      - KHÔNG ĐƯỢC lược bỏ, viết tắt hoặc ghi "giống cảnh trước" dù bối cảnh/trang phục giống hệt nhau.
      - Mỗi prompt Whisk phải là một đoạn văn độc lập mô tả: [Môi trường chi tiết] + [Ngoại hình nhân vật] + [Trang phục chi tiết màu sắc/chất liệu] + [Hành động/Biểu cảm nếm món ăn].
      - Nhất quán: Trang phục và bối cảnh phải giống hệt nhau xuyên suốt 8 phân cảnh.
      - ${outfitInstruction}
      - ${hasDialogue ? `Lời thoại: Nhân vật nói tiếng Việt tự nhiên (${voiceGender}, miền ${voiceAccent === 'north' ? 'Bắc' : 'Nam'}).` : 'Không lời thoại.'}

      DỊCH SANG JSON:
      { "scenarios": [ { "title": "Part title", "imagePrompt": "Detailed Whisk Prompt with full costume and environment", "videoPrompt": "Detailed Flow Prompt", "description": "Tóm tắt cảnh" } ] }
      Lưu ý: Tạo đúng 8 phần.
    `;

    try {
      const ai = new (window as any).GoogleGenAI({ apiKey: geminiApiKey || openaiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ inlineData: { mimeType: "image/jpeg", data: imageBase64 } }, { text: promptText }] },
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setScenarios(data.scenarios);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg("Lỗi phân tích: " + err.message);
      setStatus('error');
    }
  };

  const handleCopyAll = (type: 'whisk' | 'flow') => {
    const text = scenarios.map(s => type === 'whisk' ? s.imagePrompt : s.videoPrompt).join('\n\n');
    navigator.clipboard.writeText(text);
    if (type === 'whisk') {
      setAllWhiskCopied(true);
      setTimeout(() => setAllWhiskCopied(false), 2000);
    } else {
      setAllFlowCopied(true);
      setTimeout(() => setAllFlowCopied(false), 2000);
    }
  };

  const handleDownloadTxt = (type: 'whisk' | 'flow') => {
    const content = scenarios.map(s => type === 'whisk' ? s.imagePrompt : s.videoPrompt).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `food_review_${type}_prompts.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden ring-1 ring-white/10 rounded-2xl">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[360px] flex-none bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-20">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-tighter">FoodReview Studio</h2>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block text-center">Nhân vật</label>
                <div onClick={() => fileInputRef.current?.click()} className={`aspect-square border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all ${previewUrl ? 'border-orange-500/50 bg-slate-950' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'}`}>
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover rounded-lg" /> : <span className="text-[10px] text-slate-600">Tải ảnh mặt</span>}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Chủ đề</label>
                {Object.values(ThemeCategory).map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)} className={`w-full py-1.5 rounded-lg text-[10px] font-bold border transition-all ${category === cat ? 'bg-orange-600/20 text-orange-400 border-orange-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{cat.split('(')[0]}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Trang phục</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setOutfitMode('original')} className={`py-2 rounded-lg text-[10px] font-bold border ${outfitMode === 'original' ? 'bg-pink-600/20 text-pink-400 border-pink-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Gốc</button>
                <button onClick={() => setOutfitMode('auto')} className={`py-2 rounded-lg text-[10px] font-bold border ${outfitMode === 'auto' ? 'bg-pink-600/20 text-pink-400 border-pink-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Auto</button>
                <button onClick={() => setOutfitMode('sexy')} className={`col-span-2 py-2 rounded-lg text-[10px] font-bold border ${outfitMode === 'sexy' ? 'bg-pink-600/30 text-pink-300 border-pink-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Quyến rũ (Sexy)</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Thoại</label>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setHasDialogue(false)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${!hasDialogue ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Im lặng</button>
                <button onClick={() => setHasDialogue(true)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${hasDialogue ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Có thoại</button>
              </div>
              {hasDialogue && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                  <button onClick={() => setVoiceGender('female')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceGender === 'female' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Nữ</button>
                  <button onClick={() => setVoiceGender('male')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceGender === 'male' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Nam</button>
                  <button onClick={() => setVoiceAccent('south')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceAccent === 'south' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Nam Bộ</button>
                  <button onClick={() => setVoiceAccent('north')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceAccent === 'north' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Bắc Bộ</button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-[150px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Ý tưởng review</label>
              <textarea className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white resize-none focus:border-orange-500/50 outline-none shadow-inner" placeholder="Ví dụ: Ăn cua hoàng đế trên đỉnh Everest..." value={userIdea} onChange={e => setUserIdea(e.target.value)} />
            </div>

            <Button className="w-full py-4 text-xs tracking-widest uppercase" onClick={handleGeneratePrompts} isLoading={status === 'analyzing'}>Tạo kịch bản (8 Part)</Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 p-6 space-y-8">
          {scenarios.length > 0 ? (
            <div className="max-w-6xl mx-auto space-y-10 pb-20">
              <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md py-4 border-b border-slate-800 flex flex-col md:flex-row justify-end items-center -mx-6 px-6 gap-4">
                <div className="flex flex-wrap gap-2 justify-end">
                   {/* Whisk Section */}
                   <div className="flex gap-1.5">
                     <button 
                        onClick={() => handleCopyAll('whisk')} 
                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${allWhiskCopied ? 'bg-green-600 border-green-500 text-white' : 'bg-indigo-900/30 border-indigo-500/50 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                      >
                        {allWhiskCopied ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Đã chép</> : "Copy All Whisk"}
                      </button>
                      <button 
                        onClick={() => handleDownloadTxt('whisk')} 
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Whisk
                      </button>
                   </div>
                   {/* Flow Section */}
                   <div className="flex gap-1.5">
                     <button 
                        onClick={() => handleCopyAll('flow')} 
                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${allFlowCopied ? 'bg-green-600 border-green-500 text-white' : 'bg-pink-900/30 border-pink-500/50 text-pink-400 hover:bg-pink-600 hover:text-white'}`}
                      >
                        {allFlowCopied ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Đã chép</> : "Copy All Flow"}
                      </button>
                      <button 
                        onClick={() => handleDownloadTxt('flow')} 
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-3 h-3 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Flow
                      </button>
                   </div>
                </div>
              </div>
              {scenarios.map((s, idx) => (
                <PromptCard key={idx} index={idx} scenario={s} />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center relative">
              {/* AI Creative Visual Effect */}
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute inset-0 border-2 border-orange-500/30 rounded-full animate-ping [animation-duration:3s]"></div>
                <div className="absolute inset-4 border border-indigo-500/20 rounded-full animate-reverse-spin [animation-duration:10s]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="relative">
                      <svg className="w-20 h-20 text-orange-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <div className="absolute -top-2 -right-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping [animation-delay:0.2s]"></span>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
              <div className="mt-8 text-center space-y-2">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500 animate-pulse">AI Engine Ready</p>
                <p className="text-[10px] text-slate-600 font-mono">Nhập ý tưởng và bấm nút để bắt đầu kịch bản Food Review chuyên nghiệp</p>
              </div>
              
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes reverse-spin {
                  from { transform: rotate(360deg); }
                  to { transform: rotate(0deg); }
                }
                .animate-reverse-spin {
                  animation: reverse-spin linear infinite;
                }
              `}} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FoodReviewApp;

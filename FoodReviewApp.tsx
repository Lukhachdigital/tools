
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

const PromptCard = ({ index, scenario, onGenerateImage, imageUrl, isLoading, onViewLarge, onDownload }: any) => {
  const [copiedType, setCopiedType] = useState<'image' | 'video' | null>(null);

  const handleCopy = (text: string, type: 'image' | 'video') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-orange-500/30 transition-all duration-300 flex flex-col xl:flex-row min-h-[450px] shadow-xl">
      {/* Prompts Section */}
      <div className="flex-1 p-6 flex flex-col border-b xl:border-b-0 xl:border-r border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
            Part {index + 1}
          </div>
          <h3 className="font-bold text-lg text-white truncate">{scenario.title}</h3>
        </div>
        
        <p className="text-slate-400 italic text-sm mb-6 bg-slate-950/50 p-3 rounded-lg border-l-2 border-orange-500">
          "{scenario.description}"
        </p>

        <div className="space-y-6 flex-1">
          <div className="group/section">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Whisk AI Prompt (Image)
              </label>
              <button 
                onClick={() => handleCopy(scenario.imagePrompt, 'image')}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded border transition-all ${copiedType === 'image' ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
              >
                {copiedType === 'image' ? 'Đã chép' : 'Copy'}
              </button>
            </div>
            <div className="bg-black/40 p-4 rounded-xl text-xs text-slate-300 font-mono leading-relaxed select-all">
              {scenario.imagePrompt}
            </div>
          </div>

          <div className="group/section">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-pink-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Flow AI Prompt (Video)
              </label>
              <button 
                onClick={() => handleCopy(scenario.videoPrompt, 'video')}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded border transition-all ${copiedType === 'video' ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
              >
                {copiedType === 'video' ? 'Đã chép' : 'Copy'}
              </button>
            </div>
            <div className="bg-black/40 p-4 rounded-xl text-xs text-slate-300 font-mono leading-relaxed select-all">
              {scenario.videoPrompt}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Section */}
      <div className="w-full xl:w-[450px] bg-black flex flex-col relative">
        {imageUrl ? (
          <>
            <div className="flex-1 flex items-center justify-center p-4 cursor-zoom-in group/img" onClick={() => onViewLarge(imageUrl)}>
              <img src={imageUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg" />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                   <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                   <span className="text-[10px] font-bold text-orange-400 animate-pulse uppercase tracking-widest">Đang vẽ lại...</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
              <button onClick={() => onDownload(imageUrl)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg text-xs font-bold transition-all border border-slate-700">TẢI ẢNH</button>
              <button onClick={onGenerateImage} className="flex-1 bg-orange-600 hover:bg-orange-500 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-orange-900/20">VẼ LẠI</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/50">
            {isLoading ? (
              <div className="flex flex-col items-center">
                 <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-indigo-400 font-bold animate-pulse text-sm uppercase tracking-widest">Đang vẽ ảnh...</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700 text-slate-600">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h4 className="text-slate-300 font-bold mb-1">Visual Preview</h4>
                <p className="text-slate-500 text-xs mb-6">Tạo ảnh minh họa cho phân cảnh</p>
                <Button variant="secondary" className="px-10 py-2.5 text-xs" onClick={onGenerateImage}>TẠO ẢNH</Button>
              </div>
            )}
          </div>
        )}
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
  const [generatedImages, setGeneratedImages] = useState<{[key: number]: string}>({});
  const [loadingImages, setLoadingImages] = useState<{[key: number]: boolean}>({});
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

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
      setGeneratedImages({});
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
      : `- TRANG PHỤC MỚI (Seed ${randomSeed}): Thiết kế bộ đồ ${isSexy ? 'gợi cảm, quyến rũ' : 'sành điệu, độc đáo'} khác hoàn toàn ảnh gốc, giữ nhất quán 8 part.`;

    const promptText = `
      ROLE: Food Review Content Director.
      TASK: Tạo 8 phân cảnh liên kết (8 Parts) cho ý tưởng: "${userIdea}".
      THEME: ${category}.
      RULES: 
      - Nhất quán: Bối cảnh và trang phục phải giống hệt nhau trong 8 imagePrompt.
      - Sự khác biệt: Chỉ thay đổi góc máy, hành động nếm thử món ăn và biểu cảm.
      - ${outfitInstruction}
      - ${hasDialogue ? `Lời thoại: Nhân vật nói tiếng Việt tự nhiên (${voiceGender}, miền ${voiceAccent === 'north' ? 'Bắc' : 'Nam'}).` : 'Không lời thoại.'}

      DỊCH SANG JSON:
      { "scenarios": [ { "title": "Part title", "imagePrompt": "Detailed Whisk Prompt", "videoPrompt": "Detailed Flow Prompt", "description": "Tóm tắt cảnh" } ] }
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

  const handleGenerateImage = async (index: number, prompt: string) => {
    if (!geminiApiKey) return alert("Cần API Key Gemini để tạo ảnh.");
    setLoadingImages(prev => ({ ...prev, [index]: true }));
    try {
      const ai = new (window as any).GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [{ inlineData: { mimeType: "image/jpeg", data: imageBase64 } }, { text: `PHOTOREALISTIC, 8K, FACE IDENTITY MATCH: ${prompt}` }] }
      });
      const imgPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (imgPart) setGeneratedImages(prev => ({ ...prev, [index]: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` }));
    } catch (e: any) { alert("Lỗi vẽ ảnh: " + e.message); }
    finally { setLoadingImages(prev => ({ ...prev, [index]: false })); }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[360px] flex-none bg-slate-900/90 border-r border-slate-800 flex flex-col h-full shadow-2xl z-20">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-tighter">FoodReview Studio</h2>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Nhân vật</label>
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
                <button onClick={() => setOutfitMode('original')} className={`py-2 rounded-lg text-[10px] font-bold border ${outfitMode === 'original' ? 'bg-pink-600/20 text-pink-400 border-pink-500/50' : 'bg-slate-800 text-slate-500'}`}>Gốc</button>
                <button onClick={() => setOutfitMode('auto')} className={`py-2 rounded-lg text-[10px] font-bold border ${outfitMode === 'auto' ? 'bg-pink-600/20 text-pink-400 border-pink-500/50' : 'bg-slate-800 text-slate-500'}`}>Auto</button>
                <button onClick={() => setOutfitMode('sexy')} className={`col-span-2 py-2 rounded-lg text-[10px] font-bold border ${outfitMode === 'sexy' ? 'bg-pink-600/30 text-pink-300 border-pink-500' : 'bg-slate-800 text-slate-500'}`}>Quyến rũ (Sexy)</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Thoại</label>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setHasDialogue(false)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${!hasDialogue ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500' : 'bg-slate-800 text-slate-500'}`}>Im lặng</button>
                <button onClick={() => setHasDialogue(true)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${hasDialogue ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500' : 'bg-slate-800 text-slate-500'}`}>Có thoại</button>
              </div>
              {hasDialogue && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                  <button onClick={() => setVoiceGender('female')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceGender === 'female' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500'}`}>Nữ</button>
                  <button onClick={() => setVoiceGender('male')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceGender === 'male' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500'}`}>Nam</button>
                  <button onClick={() => setVoiceAccent('south')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceAccent === 'south' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500'}`}>Nam Bộ</button>
                  <button onClick={() => setVoiceAccent('north')} className={`py-1.5 rounded-lg text-[10px] font-bold border ${voiceAccent === 'north' ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500'}`}>Bắc Bộ</button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Ý tưởng review</label>
              <textarea className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white resize-none focus:border-orange-500/50 outline-none" placeholder="Ví dụ: Ăn cua hoàng đế trên đỉnh Everest..." value={userIdea} onChange={e => setUserIdea(e.target.value)} />
            </div>

            <Button className="w-full py-4 text-xs tracking-widest uppercase" onClick={handleGeneratePrompts} isLoading={status === 'analyzing'}>Tạo kịch bản (8 Part)</Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-black p-6 space-y-8">
          {scenarios.length > 0 ? (
            <div className="max-w-6xl mx-auto space-y-10 pb-20">
              <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md py-4 border-b border-slate-800 flex justify-between items-center -mx-6 px-6">
                <h2 className="text-xl font-bold uppercase tracking-tighter">8-Part Sequence Storyboard</h2>
                <div className="flex gap-2">
                   <button onClick={() => navigator.clipboard.writeText(scenarios.map(s => s.imagePrompt).join('\n\n'))} className="px-3 py-1.5 bg-indigo-900/30 border border-indigo-500/50 text-indigo-400 rounded-lg text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all">Copy All Whisk</button>
                   <button onClick={() => navigator.clipboard.writeText(scenarios.map(s => s.videoPrompt).join('\n\n'))} className="px-3 py-1.5 bg-pink-900/30 border border-pink-500/50 text-pink-400 rounded-lg text-[10px] font-bold hover:bg-pink-600 hover:text-white transition-all">Copy All Flow</button>
                </div>
              </div>
              {scenarios.map((s, idx) => (
                <PromptCard key={idx} index={idx} scenario={s} imageUrl={generatedImages[idx]} isLoading={loadingImages[idx]} onGenerateImage={() => handleGenerateImage(idx, s.imagePrompt)} onViewLarge={setModalImage} onDownload={url => { const a = document.createElement('a'); a.href = url; a.download = `scene-${idx+1}.jpg`; a.click(); }} />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
              <svg className="w-24 h-24 mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              <h3 className="text-2xl font-light uppercase tracking-widest">Sẵn sàng để sáng tạo</h3>
            </div>
          )}
        </main>
      </div>

      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-fade-in cursor-pointer" onClick={() => setModalImage(null)}>
          <img src={modalImage} className="max-h-[90vh] max-w-full rounded-lg shadow-2xl border border-white/10" onClick={e => e.stopPropagation()} />
          <button className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full" onClick={() => setModalImage(null)}>
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodReviewApp;

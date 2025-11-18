

import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- TYPES ---
interface ScriptResponse {
  script: string[];
}
interface ScriptParams {
  topic: string;
  numPrompts: number;
  videoStyle: 'Hoạt hình' | 'Thực tế' | 'Anime' | 'Điện ảnh' | 'Hiện đại' | 'Viễn tưởng';
  dialogueLanguage: 'Vietnamese' | 'English' | 'Không thoại';
  subtitles: boolean;
  apiKey: string;
  apiType: 'gemini' | 'gpt';
}

// --- ICONS ---
const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);
const ScriptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// --- UI COMPONENTS ---
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
    const [copiedAll, setCopiedAll] = useState(false);

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

    const handleCopyAll = () => {
        const scriptContent = data.script.join('\n\n');
        navigator.clipboard.writeText(scriptContent).then(() => {
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 2000);
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleCopyAll} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    {copiedAll ? 'Đã sao chép!' : 'Sao chép tất cả'}
                </button>
                <button onClick={downloadPromptsOnly} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Tải xuống Prompts (.txt)</button>
            </div>
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

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center p-8 h-full flex flex-col justify-center items-center">
        <svg className="animate-spin h-10 w-10 text-cyan-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-slate-400">{message}</p>
    </div>
);


// --- SERVICE LOGIC ---
const CHUNK_DURATION_SECONDS = 8;

const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); 
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16); 
  setUint16(1); 
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2); 
  setUint16(16); 
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 0;
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([view], { type: 'audio/wav' });
};

const chopAudio = async (file: File): Promise<File[]> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = originalBuffer.sampleRate;
    const numberOfChannels = originalBuffer.numberOfChannels;
    const chunkLengthInSamples = CHUNK_DURATION_SECONDS * sampleRate;
    const chunks: File[] = [];

    for (let i = 0; i * chunkLengthInSamples < originalBuffer.length; i++) {
        const startOffset = i * chunkLengthInSamples;
        const endOffset = Math.min(startOffset + chunkLengthInSamples, originalBuffer.length);
        const frameCount = endOffset - startOffset;
        if(frameCount <= 0) continue;

        const chunkBuffer = audioContext.createBuffer(numberOfChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const originalData = originalBuffer.getChannelData(channel);
            const chunkData = chunkBuffer.getChannelData(channel);
            chunkData.set(originalData.subarray(startOffset, endOffset));
        }
        const wavBlob = audioBufferToWav(chunkBuffer);
        chunks.push(new File([wavBlob], `chunk_${i + 1}.wav`, { type: 'audio/wav' }));
    }
    return chunks;
};

const generatePromptsFromAudioChunks = async (files: File[], apiKey: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const promptForSingleAudio = `You are an expert video script director. Your task is to analyze the provided audio file and generate a single, concise, visually descriptive prompt in VIETNAMESE for a video generation model like VEO. The prompt should capture the essence, mood, and key information of the entire audio file. The prompt MUST be in VIETNAMESE.
  **CRITICAL INSTRUCTIONS:**
  1.  **Analyze Audio:** Listen carefully to the entire audio content.
  2.  **Summarize Visually:** Create ONE single VIETNAMESE prompt that summarizes the audio content visually. It should be suitable for generating an 8-second video clip that represents the audio.
  3.  **Output Format (Strict):**
      *   Return ONLY the generated prompt text in VIETNAMESE.
      *   Do not include any other text, explanations, headers, or introductory/concluding remarks. Just the prompt itself.
  `;
  const generationPromises = files.map(async (file) => {
    const base64EncodedData = await new Promise<string>(r => {
        const reader = new FileReader();
        reader.onloadend = () => r((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    const audioPart = { inlineData: { data: base64EncodedData, mimeType: file.type } };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: promptForSingleAudio }, audioPart] } });
    return response.text.trim();
  });
  return Promise.all(generationPromises);
};

const generateVEO31Script = async (params: ScriptParams): Promise<ScriptResponse> => {
    // This is the logic from the former services/geminiServiceVEO31.ts
    const styleMap = { 'Hoạt hình': 'Cartoon', 'Thực tế': 'Realistic', 'Anime': 'Anime', 'Điện ảnh': 'Cinematic', 'Hiện đại': 'Modern', 'Viễn tưởng': 'Sci-fi' };
    const langMap = { 'Vietnamese': 'Vietnamese', 'English': 'English', 'Không thoại': 'None' };
    const mappedStyle = styleMap[params.videoStyle];
    const mappedLang = langMap[params.dialogueLanguage];

    const commonPrompt = `...`; // Same long prompt from geminiServiceVEO31.ts
    const fullPrompt = `BẠN LÀ MỘT ĐẠO DIỄN PHIM VÀ KỸ SƯ NHẮC LỆNH (PROMPT ENGINEER) CHUYÊN NGHIỆP CHO VEO 3.1. NHIỆM VỤ CỐT LÕI CỦA BẠN LÀ CHUYỂN THỂ TRUNG THỰC CÁC MÔ TẢ CẢNH CỦA NGƯỜI DÙNG THÀNH CÁC NHẮC LỆNH VIDEO CHI TIẾT, ĐẬM CHẤT ĐIỆN ẢNH.

    **Yêu cầu của người dùng:**
    - Scene Descriptions (one per line): 
${params.topic}
    - Total Number of Scenes to Generate: ${params.numPrompts} (This is a strict requirement based on the number of lines provided above)
    - Video Style: ${mappedStyle}
    - Dialogue Language: ${mappedLang}
    - Subtitles: OFF (This is a fixed requirement)

    **QUY TẮC SỐ 1 - TUÂN THỦ TUYỆT ĐỐI (QUAN TRỌNG NHẤT):**
    Mục tiêu hàng đầu của bạn là diễn giải và mở rộng một cách **TRUNG THỰC** ý tưởng **GỐC** mà người dùng cung cấp.
    - **KHÔNG BỊA ĐẶT:** Tuyệt đối không được bịa ra một câu chuyện mới, thêm nhân vật, hoặc các chi tiết không liên quan đến mô tả của người dùng.
    - **PHẠM VI SÁNG TẠO:** Sự sáng tạo của bạn chỉ nên được áp dụng vào việc **THỰC THI CẢNH QUAY** (góc máy, ánh sáng, chi tiết bối cảnh), không phải thay đổi nội dung cốt lõi.

    **QUY TẮC SỐ 2 - GIẢI MÃ VÀ TUÂN THỦ PHONG CÁCH (CỰC KỲ QUAN TRỌNG):**
    Bạn PHẢI tuân thủ "Phong cách Video" (${mappedStyle}) đã chọn một cách nghiêm ngặt. Đây là định nghĩa cho từng phong cách:
    - **Realistic (Thực tế):** QUAN TRỌNG NHẤT. Phong cách này yêu cầu sự chân thực tuyệt đối. Mọi thứ trong cảnh quay—con người, công nghệ, kiến trúc, quần áo, hành động—phải phản ánh chính xác thế giới **HIỆN TẠI (những năm 2020)**. **CẤM TUYỆT ĐỐI** mọi yếu tố tương lai, công nghệ viễn tưởng (như năm 2099, robot, xe bay), hay các yếu tố kỳ ảo. Nếu người dùng mô tả "một người đi trên đường phố", đó phải là một đường phố bình thường ngày nay, không phải một thành phố tương lai. Quy tắc này là BẮT BUỘC.
    - **Modern (Hiện đại):** Phong cách này cho phép thẩm mỹ đẹp mắt, sạch sẽ, và công nghệ tân tiến nhưng **có thật hoặc sắp có thật**. Ví dụ: kiến trúc tối giản, xe điện cao cấp, các thiết bị thông minh tinh vi. Vẫn bám sát thực tế, nhưng tập trung vào khía cạnh tiên tiến của thế giới hiện tại.
    - **Sci-fi (Viễn tưởng):** Cho phép tự do sáng tạo với các khái niệm tương lai xa, không gian, người ngoài hành tinh, AI siêu trí tuệ, công nghệ không tưởng.
    - **Cinematic (Điện ảnh):** Tập trung vào chất lượng hình ảnh như phim điện ảnh—ánh sáng kịch tính, màu sắc nghệ thuật, góc quay sáng tạo. Nội dung vẫn phải tuân theo logic của các phong cách khác (ví dụ: Cinematic + Realistic phải là một cảnh thực tế được quay đẹp như phim).
    - **Cartoon (Hoạt hình) & Anime:** Phong cách đồ họa, không cần tuân thủ quy luật vật lý thực tế.

    **CÁC QUY TẮC QUAN TRỌNG KHÁC:**
    1.  **KHÔNG NHẤT QUÁN NHÂN VẬT:** Bạn không cần giữ sự nhất quán về ngoại hình của nhân vật giữa các cảnh. Mỗi cảnh là độc lập. Hãy mô tả nhân vật dựa trên hành động và bối cảnh của từng cảnh.
    2.  **QUY TẮC NGÔN NGỮ:** TẤT CẢ các phần phải bằng TIẾNG ANH, NGOẠI TRỪ phần 'Dialog' phải được viết bằng '${mappedLang}'. Nếu ngôn ngữ là "None", hãy viết "Dialog: [None]".
    3.  **QUY TẮC ĐỊNH DẠNG:** Mỗi nhắc lệnh là MỘT chuỗi dài duy nhất, sử dụng " | " làm ký tự phân tách, và có chính xác 11 phần theo đúng thứ tự.
    4.  **KHÔNG CÓ VĂN BẢN TRÊN VIDEO:**
        - Phần 'Scene Title' PHẢI LUÔN LÀ "Scene Title: [None]".
        - Phần 'Subtitles' PHẢI LUÔN LÀ "Subtitles: [None]".

    **QUY TRÌNH LÀM VIỆC:**
    Đối với MỖI mô tả cảnh từ người dùng, hãy tạo ra một nhắc lệnh VEO 3.1 chi tiết. Nhắc lệnh này phải được phân tách bằng dấu gạch đứng có không gian (" | ") với chính xác 11 phần theo thứ tự sau: Scene Title, Character 1 Description, Character 2 Description, Style Description, Character Voices, Camera Shot, Setting Details, Mood, Audio Cues, Dialog, Subtitles. Bạn PHẢI tạo ra chính xác ${params.numPrompts} nhắc lệnh.`;

    if (params.apiType === 'gpt') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${params.apiKey}` },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: `${fullPrompt}\n\n**ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:** Chỉ trả về một đối tượng JSON hợp lệ chứa một khóa duy nhất là "script". Giá trị của "script" phải là một mảng chuỗi (array of strings).` }, { role: 'user', content: `Vui lòng tạo kịch bản dựa trên các yêu cầu đã được cung cấp.` }],
                response_format: { type: 'json_object' }
            })
        });
        if (!response.ok) throw new Error((await response.json()).error.message);
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } else {
        const ai = new GoogleGenAI({ apiKey: params.apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `${fullPrompt}\n\n**ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:** Chỉ trả về một đối tượng JSON hợp lệ chứa một khóa duy nhất là "script".`,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { script: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["script"] } },
        });
        return JSON.parse(response.text.trim());
    }
};

// --- MAIN APP ---
interface AppProps { geminiApiKey: string; openaiApiKey: string; selectedAIModel: string; }

const AudioToPromptVideoApp: React.FC<AppProps> = ({ geminiApiKey, openaiApiKey, selectedAIModel }) => {
    const [file, setFile] = useState<File | null>(null);
    const [videoStyle, setVideoStyle] = useState<ScriptParams['videoStyle']>('Điện ảnh');
    const [dialogueLanguage, setDialogueLanguage] = useState<ScriptParams['dialogueLanguage']>('Không thoại');
    const [scriptData, setScriptData] = useState<ScriptResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!geminiApiKey) { setError("Bước 2 yêu cầu API Key của Gemini. Vui lòng vào Cài đặt để thêm key."); return; }
        if (!file) { setError("Vui lòng tải lên một tệp âm thanh."); return; }
        
        setIsLoading(true);
        setError(null);
        setScriptData(null);

        try {
            setLoadingMessage('Bước 1/3: Đang cắt tệp âm thanh...');
            const audioChunks = await chopAudio(file);
            if (audioChunks.length === 0) throw new Error("Không thể xử lý tệp âm thanh hoặc tệp quá ngắn.");

            setLoadingMessage(`Bước 2/3: Đang tạo kịch bản từ ${audioChunks.length} đoạn âm thanh (Sử dụng Gemini)...`);
            const promptsFromAudio = await generatePromptsFromAudioChunks(audioChunks, geminiApiKey);
            
            setLoadingMessage(`Bước 3/3: Đang hoàn thiện kịch bản VEO 3.1 (Sử dụng ${selectedAIModel})...`);
            const finalPrompts = promptsFromAudio.join('\n');
            const veoParams: ScriptParams = {
                topic: finalPrompts,
                numPrompts: promptsFromAudio.length,
                videoStyle,
                dialogueLanguage,
                subtitles: false,
                apiKey: selectedAIModel === 'gemini' ? geminiApiKey : openaiApiKey,
                apiType: selectedAIModel as 'gemini' | 'gpt'
            };
            const finalScript = await generateVEO31Script(veoParams);
            setScriptData(finalScript);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Đã xảy ra một lỗi không xác định.";
            setError(message);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [file, geminiApiKey, openaiApiKey, selectedAIModel, videoStyle, dialogueLanguage]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setScriptData(null); setError(null); }};
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) { setFile(e.dataTransfer.files[0]); setScriptData(null); setError(null); }};

    const videoStyles: ScriptParams['videoStyle'][] = ['Hoạt hình', 'Thực tế', 'Anime', 'Điện ảnh', 'Hiện đại', 'Viễn tưởng'];
    const dialogueLanguages: ScriptParams['dialogueLanguage'][] = ['Vietnamese', 'English', 'Không thoại'];

    const renderContent = () => {
        if (isLoading) return <Loader message={loadingMessage} />;
        if (error) return <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"><p className="font-bold">Đã xảy ra lỗi:</p><p>{error}</p></div>;
        if (scriptData) return <ResultsDisplay data={scriptData} />;
        return (
            <div className="text-center p-8 h-full flex flex-col justify-center items-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-600">
                <ScriptIcon className="w-16 h-16 mx-auto text-cyan-400/50" />
                <h2 className="mt-4 text-xl font-bold text-slate-300">Kết quả kịch bản</h2>
                <p className="text-slate-500 mt-1">Kết quả sẽ được hiển thị ở đây sau khi bạn tạo.</p>
            </div>
        );
    };

    return (
    <div className="w-full h-full p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 xl:gap-12 h-full">
        <aside>
          <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-6">
            <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${dragOver ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600 hover:border-blue-400'} ${file ? 'border-green-500' : ''}`}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                <UploadIcon />
                <p className="text-gray-400 mt-2">
                    {file ? <span className="font-semibold text-green-400">{file.name}</span> : <span><span className="font-semibold text-blue-400">Nhấn để chọn file</span> hoặc kéo thả</span>}
                </p>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Phong cách Video</label>
                <div className="grid grid-cols-3 gap-2">
                  {videoStyles.map(style => <button type="button" key={style} onClick={() => setVideoStyle(style)} className={`py-2 px-3 text-sm font-semibold rounded-lg transition ${videoStyle === style ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`} disabled={isLoading}>{style}</button>)}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Ngôn ngữ thoại</label>
                <div className="grid grid-cols-3 gap-2">
                  {dialogueLanguages.map(lang => <button type="button" key={lang} onClick={() => setDialogueLanguage(lang)} className={`py-2 px-3 text-sm font-semibold rounded-lg transition ${dialogueLanguage === lang ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`} disabled={isLoading}>{lang}</button>)}
                </div>
            </div>
            
            <p className="text-xs text-slate-500 text-center">Bước 2 của quy trình (Tạo kịch bản từ audio) sẽ luôn sử dụng Gemini. Bước 3 sẽ sử dụng mô hình bạn đã chọn ở trên.</p>

            <button type="submit" disabled={isLoading || !file} className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Đang tạo...' : 'Tạo Kịch bản từ Audio'}
            </button>
          </form>
        </aside>
        <main className="mt-8 lg:mt-0 lg:h-[calc(100vh-200px)] lg:overflow-y-auto custom-scrollbar pr-2">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AudioToPromptVideoApp;
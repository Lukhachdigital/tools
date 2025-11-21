
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

// --- TYPES ---
interface ScriptResponse {
  script: string[];
}

// --- ICONS ---
const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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

const generatePromptsFromAudioChunks = async (files: File[], apiKey: string, style: string, language: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const styleMap: Record<string, string> = {
        'Hoạt hình': 'Cartoon, 3D Render, Vivid Colors',
        'Thực tế': 'Realistic, Photorealistic, True to life, 8k, Raw footage',
        'Anime': 'Anime Style, 2D, Japanese Animation',
        'Điện ảnh': 'Cinematic, Photorealistic, 8k, High Quality, Dramatic Lighting',
        'Hiện đại': 'Modern, Sharp, High Quality, Clean',
        'Viễn tưởng': 'Sci-fi, Futuristic, Neon, Cyberpunk'
  };

  // Negative constraints to enforce style purity
  const styleNegativeConstraints: Record<string, string> = {
      'Thực tế': 'ABSOLUTELY NO sci-fi, NO futuristic technology, NO fantasy elements, NO cartoons, NO anime, NO drawings. The scene must look like a real-world location in the present day (2024).',
      'Hoạt hình': 'NO photorealism, NO real-life footage.',
      'Anime': 'NO photorealism, NO 3D render.',
      'Điện ảnh': 'NO low quality, NO cartoonish elements unless specified.',
      'Hiện đại': 'NO ancient, NO prehistoric, NO sci-fi, NO futuristic elements.',
      'Viễn tưởng': 'NO boring present-day elements.',
  };

  const langMap: Record<string, string> = {
      'Vietnamese': 'Vietnamese',
      'English': 'English',
      'Không thoại': 'None',
  };

  const mappedStyle = styleMap[style] || styleMap['Điện ảnh'];
  const negativeConstraint = styleNegativeConstraints[style] || '';
  const mappedLang = langMap[language] || 'None';

  // STRICTLY FORCE NONE FOR VOICE AND DIALOGUE IF 'None' IS SELECTED
  const dialogueInstruction = mappedLang === 'None' 
    ? 'OUTPUT EXACTLY: "Dialog: [None]". IT IS FORBIDDEN TO WRITE ANY DIALOGUE.' 
    : `Transcribe the spoken words from the audio accurately. The language MUST be in ${mappedLang}. Prefix with "Dialog:".`;

  const voiceInstruction = mappedLang === 'None'
    ? 'OUTPUT EXACTLY: "Voice: [None]". IT IS FORBIDDEN TO DESCRIBE ANY VOICE.'
    : 'Describe the voice heard in the audio (e.g., "Voice: Male, deep, calm" or "Voice: Female, energetic"). Prefix with "Voice:".';

  const promptForSingleAudio = `You are an expert video script director for VEO 3.1. Your task is to analyze the provided audio file and generate a video generation prompt that strictly follows the VEO 3.1 format.

    **FORMAT REQUIREMENTS (Strictly Enforced):**
    The output must be a SINGLE string with exactly 11 parts separated by " | ".
    Format: Scene Title | Character 1 Description | Character 2 Description | Style Description | Character Voices | Camera Shot | Setting Details | Mood | Audio Cues | Dialog | Subtitles

    **USER SETTINGS:**
    - **Visual Style:** ${style} (Keywords: ${mappedStyle})
    - **Dialogue Mode:** ${language}

    **MANDATORY VISUAL STYLE INSTRUCTIONS:**
    - **NEGATIVE CONSTRAINTS:** ${negativeConstraint}
    - The descriptions for "Character 1", "Character 2", and "Setting Details" MUST strictly reflect the "${style}" style.
    - If "${style}" is "Hoạt hình" (Cartoon), you MUST describe characters and settings as stylized, animated, 3D render, colorful.
    - If "${style}" is "Thực tế" (Realistic), you MUST describe them as photorealistic, raw, 8k, detailed textures of REAL LIFE. Do not include anything that does not exist in the real world today.
    - If "${style}" is "Anime", you MUST describe them as 2D animation, anime art style.

    **CONTENT GUIDELINES:**
    1.  **Scene Title**: Always "Scene Title: [None]".
    2.  **Character 1 Description**: Describe the main subject visible in the video based on the audio context. Prefix with "Character 1:". Ensure the visual description matches the "${style}" style.
    3.  **Character 2 Description**: Describe a secondary character or write "Character 2: [None]".
    4.  **Style Description**: "Style: ${mappedStyle}".
    5.  **Character Voices**: ${voiceInstruction}
    6.  **Camera Shot**: Describe a camera movement suitable for an 8-second clip (e.g., "Camera: Slow zoom in", "Camera: Pan right").
    7.  **Setting Details**: Describe the environment/background that matches the audio's context. Prefix with "Setting:". Ensure the setting visuals align with the "${style}" style.
    8.  **Mood**: The emotional tone of the audio. Prefix with "Mood:".
    9.  **Audio Cues**: Describe background sounds or music heard in the audio file. Prefix with "Audio:". DO NOT describe voices here if Dialogue Mode is None.
    10. **Dialog**: ${dialogueInstruction}
    11. **Subtitles**: Always "Subtitles: [None]".

    **CRITICAL INSTRUCTIONS:**
    - If "Không thoại" (None) is selected, you MUST strictly output "Voice: [None]" and "Dialog: [None]". Do not describe voices or transcribe speech in these fields under any circumstances.
    - Output ONLY the formatted string. No markdown, no explanations.
  `;
  
  const prompts: string[] = [];
  // Process files sequentially to avoid Rate Limit 429
  for (const file of files) {
    const base64EncodedData = await new Promise<string>(r => {
        const reader = new FileReader();
        reader.onloadend = () => r((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    const audioPart = { inlineData: { data: base64EncodedData, mimeType: file.type } };
    
    // Add small delay between chunks
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: promptForSingleAudio }, audioPart] } });
    let promptText = response.text.trim();

    // FORCE POST-PROCESSING TO REMOVE VOICE/DIALOGUE IF "NONE" SELECTED
    if (mappedLang === 'None') {
        const parts = promptText.split('|');
        // Index 4 is Character Voices, Index 9 is Dialog in 11-part VEO format.
        if (parts.length >= 10) {
            parts[4] = " Voice: [None] ";
            parts[9] = " Dialog: [None] ";
            promptText = parts.join('|');
        }
    }
    prompts.push(promptText);
  }
  return prompts;
};

// --- MAIN APP COMPONENT ---
interface AudioToPromptVideoAppProps {
    geminiApiKey: string;
    openaiApiKey: string;
    selectedAIModel: string;
}

const AudioToPromptVideoApp: React.FC<AudioToPromptVideoAppProps> = ({ geminiApiKey }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ScriptResponse | null>(null);
    const [dragOver, setDragOver] = useState<boolean>(false);
    const [videoStyle, setVideoStyle] = useState('Điện ảnh');
    const [dialogueLanguage, setDialogueLanguage] = useState('Không thoại'); // Default is 'Không thoại'
    const [processingStatus, setProcessingStatus] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const videoStyles = ['Hoạt hình', 'Thực tế', 'Anime', 'Điện ảnh', 'Hiện đại', 'Viễn tưởng'];
    const dialogueLanguages = ['Vietnamese', 'English', 'Không thoại'];

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            if(files[0].type.startsWith('audio/')){
                setFile(files[0]);
                setResults(null);
                setError(null);
            } else {
                setError("Vui lòng chọn file âm thanh.");
            }
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOver(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
             if(files[0].type.startsWith('audio/')){
                setFile(files[0]);
                setResults(null);
                setError(null);
            } else {
                setError("Vui lòng chọn file âm thanh.");
            }
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOver(false);
    };

    const handleGenerate = useCallback(async () => {
        if (!geminiApiKey) {
            setError("Vui lòng cài đặt Gemini API Key.");
            return;
        }
        if (!file) {
            setError("Vui lòng chọn file audio.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);
        setProcessingStatus('Đang cắt file audio...');

        try {
            // Step 1: Chop audio
            const chunks = await chopAudio(file);
            
            setProcessingStatus(`Đang tạo prompt từ ${chunks.length} đoạn âm thanh... (Vui lòng đợi)`);

            // Step 2: Generate prompts for chunks
            const prompts = await generatePromptsFromAudioChunks(chunks, geminiApiKey, videoStyle, dialogueLanguage);
            
            setResults({ script: prompts });
        } catch (e) {
            console.error(e);
            // Translate specific API errors if needed
            let errorMessage = "Đã xảy ra lỗi không xác định.";
            if (e instanceof Error) {
                if (e.message.includes('429') || e.message.toLowerCase().includes('quota')) {
                    errorMessage = "Hệ thống đang bận, vui lòng thử lại sau giây lát (Lỗi 429/Quota).";
                } else if (e.message.toLowerCase().includes('api key')) {
                    errorMessage = "API Key không hợp lệ. Vui lòng kiểm tra lại.";
                } else {
                    errorMessage = e.message;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setProcessingStatus('');
        }
    }, [file, geminiApiKey, videoStyle, dialogueLanguage]);
    
    const buttonClasses = (isSelected: boolean) => `py-2 px-2 text-xs font-semibold rounded-lg transition ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`;

    return (
        <div className="w-full h-full p-4">
            <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12">
                {/* Left Column: Upload */}
                <div className="md:w-2/5 lg:w-1/3 mb-8 md:mb-0">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 sticky top-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-200 mb-2">1. Tải lên File Audio</h2>
                            <div 
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 cursor-pointer ${dragOver ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600 hover:border-blue-400'}`}
                            >
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    ref={fileInputRef}
                                />
                                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                                    <UploadIcon/>
                                    <p className="text-gray-400">
                                        <span className="font-semibold text-blue-400">Nhấn để chọn file</span> hoặc kéo thả
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {file && (
                             <div className="bg-gray-900/50 p-3 rounded-md text-center">
                                <p className="text-gray-300 font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        )}
                        
                        {/* Style Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300">Phong cách Video</label>
                            <div className="grid grid-cols-3 gap-2">
                                {videoStyles.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => setVideoStyle(style)}
                                        className={buttonClasses(videoStyle === style)}
                                        disabled={isLoading}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300">Ngôn ngữ thoại</label>
                            <div className="grid grid-cols-3 gap-2">
                                {dialogueLanguages.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => setDialogueLanguage(lang)}
                                        className={buttonClasses(dialogueLanguage === lang)}
                                        disabled={isLoading}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !file}
                            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Đang xử lý...' : '2. Tạo Prompt Video'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="md:w-3/5 lg:w-2/3 md:h-[calc(100vh-150px)] md:overflow-y-auto custom-scrollbar md:pr-4">
                    {isLoading && <Loader message={processingStatus || "Đang cắt file audio và tạo prompt..."} />}
                    {error && (
                         <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-8">
                            <strong className="font-bold">Lỗi! </strong>
                            <span className="block sm:inline ml-2">{error}</span>
                        </div>
                    )}
                    {results && <ResultsDisplay data={results} />}
                    {!isLoading && !error && !results && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Kết quả sẽ hiển thị ở đây</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioToPromptVideoApp;

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

const generatePromptsFromAudioChunks = async (files: File[], apiKey: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const promptForSingleAudio = `You are an expert video script director. Your task is to analyze the provided audio file and generate a single, concise, visually descriptive prompt for a video generation model like VEO. The prompt should capture the essence, mood, and key information of the entire audio file.
  
  **CRITICAL INSTRUCTIONS:**
  1.  **Analyze Audio:** Listen carefully to the entire audio content.
  2.  **Summarize Visually:** Create ONE single prompt that summarizes the audio content visually. It should be suitable for generating an 8-second video clip that represents the audio.
  3.  **Output Format (Strict):**
      *   Return ONLY the generated prompt text.
      *   Do not include any other text, explanations, headers, or introductory/concluding remarks. Just the prompt itself.
      *   The prompt can be in English or Vietnamese, but English is preferred for better compatibility with video models.
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        try {
            // Step 1: Chop audio
            const chunks = await chopAudio(file);
            
            // Step 2: Generate prompts for chunks
            const prompts = await generatePromptsFromAudioChunks(chunks, geminiApiKey);
            
            setResults({ script: prompts });
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
        }
    }, [file, geminiApiKey]);

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
                    {isLoading && <Loader message="Đang cắt file audio và tạo prompt..." />}
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

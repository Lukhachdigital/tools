import React, { useState, useCallback, useEffect, useRef } from 'react';

// --- TYPES ---
interface AudioChunk {
  id: string;
  name: string;
  blob: Blob;
  url: string;
}

// --- ICONS ---
const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-16 h-16 text-slate-500 mb-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-4-4m4 4l4-4m-4 4V3" />
  </svg>
);
const AudioFileIcon: React.FC<{ className?: string }> = ({ className = "w-24 h-24 text-cyan-400" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
    </svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 h-full">
        <svg className="animate-spin h-16 w-16 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-300 text-lg">Đang xử lý âm thanh... Vui lòng chờ.</p>
    </div>
);


// JSZip is loaded from a script tag in index.html, so we declare it globally here for TypeScript
declare const JSZip: any;

const CHUNK_DURATION_SECONDS = 8;

// --- HELPERS ---
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels: Float32Array[] = [];
  let i: number, sample: number;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // chunk size
  setUint16(1); // audio format 1
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([view], { type: 'audio/wav' });
};


// --- MAIN APP COMPONENT ---
const AudioChoppingApp: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioChunks, setAudioChunks] = useState<AudioChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      audioChunks.forEach(chunk => URL.revokeObjectURL(chunk.url));
    };
  }, [audioChunks]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if(files[0].type.startsWith('audio/')){
        setFile(files[0]);
        setAudioChunks([]);
        setError(null);
      } else {
        setError("Loại tệp không hợp lệ. Vui lòng tải lên một tệp âm thanh.");
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragOver(true); };
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragOver(false); };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      if(files[0].type.startsWith('audio/')){
        setFile(files[0]);
        setAudioChunks([]);
        setError(null);
      } else {
        setError("Loại tệp không hợp lệ. Vui lòng tải lên một tệp âm thanh.");
      }
    }
  };
  
  const clearFile = () => {
      setFile(null);
      setAudioChunks([]);
      setError(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const processAudio = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setAudioChunks([]);

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const sampleRate = originalBuffer.sampleRate;
      const numberOfChannels = originalBuffer.numberOfChannels;
      const totalDuration = originalBuffer.duration;
      const chunkLengthInSamples = CHUNK_DURATION_SECONDS * sampleRate;

      const newChunks: AudioChunk[] = [];

      for (let i = 0; i * CHUNK_DURATION_SECONDS < totalDuration; i++) {
        const startOffsetInSamples = i * chunkLengthInSamples;
        const endOffsetInSamples = Math.min(startOffsetInSamples + chunkLengthInSamples, originalBuffer.length);
        const frameCount = endOffsetInSamples - startOffsetInSamples;
        
        if (frameCount <= 0) continue;

        const chunkBuffer = audioContext.createBuffer(numberOfChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numberOfChannels; channel++) {
          const originalChannelData = originalBuffer.getChannelData(channel);
          const chunkChannelData = chunkBuffer.getChannelData(channel);
          chunkChannelData.set(originalChannelData.subarray(startOffsetInSamples, endOffsetInSamples));
        }

        const wavBlob = audioBufferToWav(chunkBuffer);
        const chunkName = `AICreators ${String(i + 1).padStart(3, '0')}.wav`;
        newChunks.push({
          id: `${file.name}_${i}`,
          name: chunkName,
          blob: wavBlob,
          url: URL.createObjectURL(wavBlob),
        });
      }
      setAudioChunks(newChunks);
    } catch (e) {
      console.error("Lỗi xử lý âm thanh:", e);
      setError("Không thể xử lý tệp âm thanh. Tệp có thể bị hỏng hoặc có định dạng không được hỗ trợ.");
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const downloadAllAsZip = useCallback(async () => {
    if (audioChunks.length === 0) return;
    
    const zip = new JSZip();
    audioChunks.forEach(chunk => {
      zip.file(chunk.name, chunk.blob);
    });

    try {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `AICreators_chunks.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        console.error("Lỗi tạo tệp zip:", e);
        setError("Không thể tạo tệp zip.");
    }
  }, [audioChunks]);
  
  const renderInitialState = () => (
    <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer flex flex-col justify-center items-center h-full transition-colors duration-300 ${dragOver ? 'border-cyan-500 bg-slate-700/50' : 'border-slate-600 hover:border-cyan-400'}`}
    >
        <UploadIcon />
        <p className="text-xl font-semibold text-slate-300">Kéo & Thả tệp âm thanh của bạn vào đây</p>
        <p className="text-slate-400 mt-2">hoặc nhấn để chọn tệp</p>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
    </div>
  );

  const renderFileSelectedState = () => (
      <div className="text-center p-8 flex flex-col items-center justify-center h-full">
          <AudioFileIcon />
          <p className="mt-4 text-lg font-medium truncate max-w-full px-4" title={file!.name}>{file!.name}</p>
          <p className="text-sm text-slate-400">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={processAudio}
              className="px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 font-semibold text-lg"
            >
              Cắt thành các đoạn 8 giây
            </button>
            <button
                onClick={clearFile}
                className="px-6 py-3 bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors font-semibold text-lg"
            >
                Đổi Tệp
            </button>
          </div>
      </div>
  );
  
  const renderResultsState = () => (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Các Đoạn Đã Tạo</h2>
            <p className="text-slate-400">{audioChunks.length} đoạn {CHUNK_DURATION_SECONDS} giây đã được tạo.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <button
                onClick={downloadAllAsZip}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 font-semibold"
            >
                <DownloadIcon />
                Tải Tất Cả (.zip)
            </button>
             <button
                onClick={clearFile}
                className="w-full sm:w-auto px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors font-semibold"
            >
                Bắt đầu lại
            </button>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {audioChunks.map(chunk => (
          <div key={chunk.id} className="bg-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-lg border border-slate-700">
            <p className="font-semibold text-sm truncate mb-2 text-slate-200" title={chunk.name}>{chunk.name}</p>
            <audio controls src={chunk.url} className="w-full h-10 mb-3"></audio>
            <a
              href={chunk.url}
              download={chunk.name}
              className="w-full flex items-center justify-center gap-2 text-center bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
               <DownloadIcon className="w-4 h-4" /> Tải xuống
            </a>
          </div>
        ))}
      </div>
    </div>
  );

  let content;
  if(isProcessing) content = <Loader />;
  else if (audioChunks.length > 0) content = renderResultsState();
  else if (file) content = renderFileSelectedState();
  else content = renderInitialState();

  return (
    <div className="w-full h-full p-4 flex flex-col">
        <div className="w-full h-full flex-grow bg-slate-800/50 rounded-2xl shadow-2xl ring-1 ring-white/10 flex flex-col justify-center">
          {content}
        </div>
        {error && (
            <div className="w-full max-w-2xl mx-auto mt-4 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center">
                <strong>Lỗi:</strong> {error}
            </div>
        )}
    </div>
  );
}

export default AudioChoppingApp;

import React, { useState, useCallback } from 'react';
import { generatePromptsFromAudio } from './services/geminiService';

const FileUploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-300 text-lg">AI đang lắng nghe và sáng tạo... Vui lòng chờ.</p>
    </div>
);

const PromptResult: React.FC<{ prompt: string; index: number }> = ({ prompt, index }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };
    
    return (
        <div className="relative bg-gray-700 rounded-lg p-4 mb-4 shadow-md transition-transform duration-300 border border-gray-600">
            <h3 className="font-bold text-lg text-blue-400 pr-10">Prompt {index + 1}</h3>
            <p className="text-gray-200 mt-2 whitespace-pre-wrap text-sm">{prompt}</p>
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                aria-label="Sao chép prompt"
            >
                {isCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
};


const AudioToPromptApp: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [isAllCopied, setIsAllCopied] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
      setResults([]);
      setError(null);
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files) {
      const audioFiles = Array.from(event.dataTransfer.files).filter((file: File) => file.type.startsWith('audio/'));
      if(audioFiles.length > 0) {
        setFiles(audioFiles);
        setResults([]);
        setError(null);
      } else {
        setError("Vui lòng chỉ kéo thả file âm thanh.");
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  };

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError("API Key chưa được cấu hình. Vui lòng vào Cài đặt API Key trong menu chính.");
      return;
    }
    if (files.length === 0) {
      setError("Vui lòng chọn ít nhất một file audio.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await generatePromptsFromAudio(files, apiKey);
      setResults(response);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Đã xảy ra lỗi không xác định.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [files, apiKey]);
  
  const handleDownload = () => {
    if (results.length === 0) return;
    
    // Join prompts with two empty lines, with no extra characters.
    const textContent = results.join('\n\n\n');
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audio_prompts.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleCopyAll = () => {
    if (results.length === 0) return;
    const textContent = results.join('\n\n\n');
    navigator.clipboard.writeText(textContent).then(() => {
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy all prompts: ', err);
        setError("Không thể sao chép prompts.");
    });
  };

  return (
    <div className="w-full h-full p-4">
        <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12">
          
          {/* Left Column */}
          <div className="md:w-2/5 lg:w-1/3 mb-8 md:mb-0">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 sticky top-8 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-200 mb-2">1. Tải lên File Audio</h2>
                    <div 
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${dragOver ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600 hover:border-blue-400'}`}
                    >
                        <input
                        type="file"
                        multiple
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="file-upload"
                        />
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
                        <FileUploadIcon/>
                        <p className="text-gray-400">
                            <span className="font-semibold text-blue-400">Nhấn để chọn file</span> hoặc kéo thả
                        </p>
                        <p className="text-xs text-gray-500">Hỗ trợ nhiều file cùng lúc</p>
                        </label>
                    </div>
                </div>
            
                {files.length > 0 && (
                    <div className="animate-fade-in bg-gray-900/50 p-3 rounded-md text-center">
                        <p className="text-gray-300">
                            Tổng số file đã chọn: <span className="font-bold text-blue-400 text-lg">{files.length}</span>
                        </p>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || files.length === 0}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? 'Đang xử lý...' : '2. Tạo Prompt'}
                </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:w-3/5 lg:w-2/3 md:h-[calc(100vh-200px)] md:overflow-y-auto custom-scrollbar md:pr-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-200">3. Kết quả</h2>
              {results.length > 0 && !isLoading && (
                 <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyAll}
                        className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors duration-300 flex items-center gap-2 text-sm"
                    >
                        {isAllCopied ? 'Đã sao chép!' : 'Sao chép tất cả'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors duration-300 flex items-center gap-2 text-sm"
                        aria-label="Tải về tất cả prompts"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span>Tải về (.txt)</span>
                    </button>
                </div>
              )}
            </div>
            <div className="min-h-[400px]">
              {isLoading && <Loader />}
              {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-8" role="alert"><strong className="font-bold">Lỗi! </strong><span className="block sm:inline ml-2">{error}</span></div>}
              {!isLoading && !error && results.length === 0 && (
                 <div className="flex items-center justify-center h-full text-gray-500 text-center p-8">
                    Kết quả sẽ xuất hiện ở đây...
                 </div>
              )}
              {!isLoading && results.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                      {results.map((prompt, index) => (
                          <PromptResult key={index} prompt={prompt} index={index} />
                      ))}
                  </div>
              )}
            </div>
          </div>

        </div>
    </div>
  );
};

export default AudioToPromptApp;
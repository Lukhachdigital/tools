import React, { useState } from 'react';
import InputForm from './components/AIPromptVEO31/InputForm';
import ResultsDisplay from './components/AIPromptVEO31/ResultsDisplay';
import { generateScript } from './services/geminiServiceVEO31';
import type { ScriptParams, ScriptResponse } from './types/veo31';
import { ScriptIcon } from './components/AIPromptVEO31/icons';

interface AIPromptVEO31AppProps {
  apiKey: string;
}

const AIPromptVEO31App: React.FC<AIPromptVEO31AppProps> = ({ apiKey }) => {
  const [params, setParams] = useState<Omit<ScriptParams, 'apiKey' | 'numPrompts'>>({
    topic: '',
    videoStyle: 'Điện ảnh',
    dialogueLanguage: 'Không thoại',
    subtitles: false,
  });
  const [scriptData, setScriptData] = useState<ScriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setScriptData(null);

    const userPrompts = params.topic.split('\n').filter(p => p.trim() !== '');
    if (userPrompts.length === 0) {
        setError("Vui lòng nhập ít nhất một prompt.");
        setIsLoading(false);
        return;
    }

    try {
      const fullParams: ScriptParams = { 
        ...params, 
        apiKey,
        numPrompts: userPrompts.length 
      };
      const response = await generateScript(fullParams);
      setScriptData(response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra một lỗi không xác định.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const WelcomeMessage = () => (
    <div className="text-center p-8 h-full flex flex-col justify-center items-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-600">
        <ScriptIcon className="w-16 h-16 mx-auto text-cyan-400/50" />
        <h2 className="mt-4 text-xl font-bold text-slate-300">AI Prompt VEO 3.1</h2>
        <p className="text-slate-500 mt-1">Nhập các tùy chọn của bạn để bắt đầu tạo kịch bản.</p>
    </div>
  );
  
  const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
      <p className="font-bold">Đã xảy ra lỗi:</p>
      <p>{message}</p>
    </div>
  );

  const LoadingDisplay = () => (
    <div className="text-center p-8 h-full flex flex-col justify-center items-center">
        <svg className="animate-spin h-10 w-10 text-cyan-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-slate-400">Đang tạo kiệt tác của bạn... vui lòng đợi.</p>
    </div>
  );

  return (
    <div className="w-full h-full p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 xl:gap-12 h-full">
          <aside>
               <InputForm 
                  params={params}
                  setParams={setParams}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
              />
          </aside>
          <main className="mt-8 lg:mt-0 lg:h-[calc(100vh-200px)] lg:overflow-y-auto custom-scrollbar pr-2">
              {error && <ErrorDisplay message={error} />}
              
              {isLoading && <LoadingDisplay />}

              {scriptData && !isLoading && <ResultsDisplay data={scriptData} />}

              {!scriptData && !isLoading && !error && <WelcomeMessage />}
          </main>
      </div>
    </div>
  );
};

export default AIPromptVEO31App;
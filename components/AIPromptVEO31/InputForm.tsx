import React from 'react';
import type { ScriptParams } from '../../types/veo31';

interface InputFormProps {
  params: Omit<ScriptParams, 'apiKey' | 'numPrompts'>;
  setParams: React.Dispatch<React.SetStateAction<Omit<ScriptParams, 'apiKey' | 'numPrompts'>>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ params, setParams, onSubmit, isLoading }) => {
  
  const videoStyles: Array<ScriptParams['videoStyle']> = ['Hoạt hình', 'Thực tế', 'Anime', 'Điện ảnh', 'Hiện đại', 'Viễn tưởng'];
  const dialogueLanguages: Array<ScriptParams['dialogueLanguage']> = ['Vietnamese', 'English', 'Không thoại'];

  const handleParamChange = (field: keyof Omit<ScriptParams, 'apiKey' | 'numPrompts'>, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };
  
  const numPrompts = params.topic.split('\n').filter(p => p.trim() !== '').length;

  const formElementClasses = "space-y-2";
  const labelClasses = "block text-sm font-semibold text-slate-300";
  const inputBaseClasses = "w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition";
  const buttonGroupClasses = "grid grid-cols-2 sm:grid-cols-3 gap-2";
  const buttonClasses = (isSelected: boolean) => `py-2 px-3 text-sm font-semibold rounded-lg transition ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`;

  return (
    <form onSubmit={onSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-6">
      <div className={formElementClasses}>
        <div className="flex justify-between items-center">
            <label htmlFor="topic" className={labelClasses}>Nhập Prompt vào đây (Mỗi dòng 1 Prompt)</label>
            {numPrompts > 0 && (
                <span className="text-sm font-semibold text-cyan-400 bg-slate-700/50 px-2 py-1 rounded">
                Số lượng: {numPrompts}
                </span>
            )}
        </div>
        <textarea
          id="topic"
          value={params.topic}
          onChange={(e) => handleParamChange('topic', e.target.value)}
          placeholder="Cảnh 1: Một nhà thám hiểm tìm thấy một thành phố đã mất trong rừng rậm...
Cảnh 2: Anh ta bước vào một ngôi đền cổ kính..."
          rows={6}
          className={`${inputBaseClasses} resize-y mt-2`}
          required
          disabled={isLoading}
        />
      </div>

      <div className={formElementClasses}>
        <label className={labelClasses}>Phong cách Video</label>
        <div className={buttonGroupClasses}>
          {videoStyles.map(style => (
            <button
              type="button"
              key={style}
              onClick={() => handleParamChange('videoStyle', style)}
              className={buttonClasses(params.videoStyle === style)}
              disabled={isLoading}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className={formElementClasses}>
        <label className={labelClasses}>Ngôn ngữ thoại</label>
        <div className={buttonGroupClasses}>
          {dialogueLanguages.map(lang => (
            <button
              type="button"
              key={lang}
              onClick={() => handleParamChange('dialogueLanguage', lang)}
              className={buttonClasses(params.dialogueLanguage === lang)}
              disabled={isLoading}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading || !params.topic.trim()}
        className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading && (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isLoading ? 'Đang tạo...' : 'Tạo Kịch bản'}
      </button>
    </form>
  );
};

export default InputForm;
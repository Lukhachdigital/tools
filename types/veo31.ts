export interface ScriptParams {
  topic: string;
  numPrompts: number;
  videoStyle: 'Hoạt hình' | 'Thực tế' | 'Anime' | 'Điện ảnh';
  dialogueLanguage: 'Vietnamese' | 'English' | 'Không thoại';
  subtitles: boolean;
  apiKey: string;
}

export interface CharacterAnalysis {
  name: string;
  description: string;
  voice: string;
}

export interface ScriptResponse {
  characterAnalysis: CharacterAnalysis[];
  script: string[];
}

export interface ScriptParams {
  topic: string;
  numPrompts: number;
  videoStyle: 'Hoạt hình' | 'Thực tế' | 'Anime' | 'Điện ảnh' | 'Hiện đại' | 'Viễn tưởng';
  dialogueLanguage: 'Vietnamese' | 'English' | 'Không thoại';
  subtitles: boolean;
  apiKey: string;
}

export interface ScriptResponse {
  script: string[];
}
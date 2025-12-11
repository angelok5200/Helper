export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

export interface BlueprintState {
  techStack: string[];
  features: string[];
  designStyle: string;
  status: 'consulting' | 'generating_blueprint' | 'complete';
}

export enum GeminiModel {
  CHAT = 'gemini-2.5-flash',
  ARCHITECT = 'gemini-3-pro-preview',
}

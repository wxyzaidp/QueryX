export type AIModel = 
  | 'gemini-1.5-flash'
  | 'gemini-1.0-pro';

export interface ChatBody {
  inputCode: string;
  model: AIModel;
  apiKey?: string;
}

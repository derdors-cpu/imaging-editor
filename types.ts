
export enum AppTab {
  HOME = 'home',
  EDITOR = 'editor',
  CONVERTER = 'converter',
  AI_IMAGING = 'ai-imaging',
  FOTOMAX = 'fotomax',
  MOCKUP = 'mockup',
  PICTALK = 'pictalk',
  AI_CINEMAX = 'ai-cinemax',
  CHATBOT = 'chatbot',
  IDEA_PROMPT = 'idea-prompt',
  RESOURCES = 'resources'
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  font: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  shadow: boolean;
  align: 'left' | 'center' | 'right';
  rotation: number;
}

export interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  rotation: number;
  zoom: number;
  panX: number;
  panY: number;
  texts: TextLayer[];
  maskDataUrl: string | null;
  filter: string;
}

export interface HistoryItem {
  imageSrc: string;
  editorState: EditorState;
}

export enum MockupSubTab {
  DESIGN = 'design',
  PRODUCT = 'product',
  POSTER = 'poster'
}

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
}

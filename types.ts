export interface Message {
  id: string;
  text: string;
  role: 'user' | 'model';
  sources?: GroundingChunk[];
}

export interface NavItem {
  label: string;
  view: string;
  description: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets: {
            uri: string;
            text: string;
        }[]
    }
  }
}

export interface FileChange {
  file: string;
  description: string;
  content: string;
}
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

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: 'T-Shirts' | 'Hoodies' | 'Accessories';
  description: string;
}

export interface Laptop {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    specs: {
      cpu: string;
      gpu: string;
      ram: string;
      storage: string;
      display: string;
    }
}

export interface Mobile {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    specs: {
      cpu: string;
      ram: string;
      storage: string;
      display: string;
      camera: string;
    }
}
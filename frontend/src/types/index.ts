export interface JourneyState {
  currentPage: number;
  consent: boolean;
  sentiment: string;
  timeframe: string;
  device: string;
  industry: string;
  quantumId: string;
  publicKey: string;
  signature: string;
  jobId: string;
}

export type DeviceCategory = 'simulator' | 'qpu';
export type SimulatorSubcategory = 'cpu' | 'gpu';
export type QPUParadigm = 'gate-model' | 'analog';
export type QPUTechnology = 'ion-trap' | 'superconducting' | 'neutral-atom';
export type DeviceSubcategory = SimulatorSubcategory | QPUTechnology;

export interface DeviceInfo {
  id: string;
  name: string;
  shortName: string;
  type: string;
  category: DeviceCategory;
  subcategory: DeviceSubcategory;
  paradigm?: QPUParadigm; // Only for QPU: 'gate-model' or 'analog'
  vendor?: string; // Company/vendor name (e.g., 'IonQ', 'IQM', 'Rigetti', 'QuEra')
  icon: string; // Lucide icon name
  iconBg: string;
  features: string[];
  runtime: string;
  color: string;
  content: string;
  visualization: 'cloud' | 'cloud-dm' | 'cloud-gpu' | 'ion' | 'ion-aqt' | 'superconducting' | 'atom' | 'rigetti';
  maintenance?: boolean;
}

export interface BlockchainTechOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface NobelLaureate {
  name: string;
  affiliation: string;
  contribution: string;
  bio: string;
  initial: string;
  photo: string;
}

export interface WordCloudWord {
  text: string;
  weight: number;
  color: string;
}

export type PageType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 'dashboard';

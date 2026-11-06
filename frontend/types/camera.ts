export type CameraStreamStatus = 'idle' | 'starting' | 'live' | 'error';

export interface CameraStreamSnapshot {
  status: CameraStreamStatus;
  viewers: number;
  message?: string;
}

export interface CameraRecord {
  id: string;
  name: string;
  host: string;
  transcode: boolean;
  createdAt: string;
  stream: CameraStreamSnapshot;
}

export interface CameraInput {
  name: string;
  url: string;
  transcode: boolean;
}

export interface CameraDetail {
  id: string;
  name: string;
  host: string;
  url: string;
  transcode: boolean;
  createdAt: string;
}

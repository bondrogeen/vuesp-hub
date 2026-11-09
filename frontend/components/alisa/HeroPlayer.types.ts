export interface HeroTrack {
  id?: string;
  title: string;
  artists: string;
  coverUrl: string | null;
  duration: number;
  progress: number;
}

export interface HeroPlayerProps {
  track: HeroTrack;
  playing: boolean;
  wave: boolean;
  liked: boolean;
  source: 'speaker' | 'page';
  loading?: boolean;
  hasPrev?: boolean;
  hasNext?: boolean;
  volume?: number;
}

export interface HeroPlayerEmits {
  toggle: [];
  prev: [];
  next: [];
  like: [];
  volume: [value: number];
}

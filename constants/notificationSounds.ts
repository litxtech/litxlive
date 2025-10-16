export type NotificationSoundPreset = 'classic' | 'soft' | 'pop' | 'silent';

export interface NotificationSound {
  id: NotificationSoundPreset;
  name: string;
  description: string;
  file: string;
  duration: number;
}

export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, short notification tone',
    file: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    duration: 300,
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Gentle, subtle notification',
    file: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    duration: 400,
  },
  {
    id: 'pop',
    name: 'Pop',
    description: 'Upbeat, cheerful tone',
    file: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3',
    duration: 350,
  },
  {
    id: 'silent',
    name: 'Silent',
    description: 'Vibration only, no sound',
    file: '',
    duration: 0,
  },
];

export const GIFT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3';
export const CALL_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3';

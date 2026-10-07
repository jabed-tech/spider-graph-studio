export interface SizePreset { id: string; label: string; w: number; h: number }

export const SIZES: SizePreset[] = [
  { id: 'portrait', label: 'Portrait post', w: 1080, h: 1350 },
  { id: 'square', label: 'Square post', w: 1080, h: 1080 },
  { id: 'story', label: 'Story', w: 1080, h: 1920 },
  { id: 'landscape', label: 'Landscape', w: 1920, h: 1080 },
  { id: 'card', label: 'Trading card', w: 750, h: 1050 },
]

let sharedAudioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return null;
  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new AudioContext();
    } catch (e) {
      return null;
    }
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
};

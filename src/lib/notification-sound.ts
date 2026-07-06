let audioContext: AudioContext | null = null;
let unlocked = false;

export function unlockNotificationAudio() {
  if (typeof window === "undefined") return;

  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  unlocked = true;
}

export function playNotificationBell() {
  if (typeof window === "undefined") return;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;

    const playTone = (frequency: number, start: number, duration: number, volume: number) => {
      const oscillator = audioContext!.createOscillator();
      const gain = audioContext!.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.92, now + start + duration);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      oscillator.connect(gain);
      gain.connect(audioContext!.destination);

      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.05);
    };

    // Bell-like double chime
    playTone(880, 0, 0.35, 0.22);
    playTone(1174.66, 0.12, 0.45, 0.18);
    playTone(659.25, 0.28, 0.55, 0.12);

    unlocked = true;
  } catch {
    // Ignore if browser blocks audio.
  }
}

export function isNotificationAudioUnlocked() {
  return unlocked;
}

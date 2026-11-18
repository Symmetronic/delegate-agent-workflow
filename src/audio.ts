export type SoundCue =
  "footstep" | "select" | "hit" | "encounter" | "self-destruct";

export type MusicTrack = "background" | "fight";

export interface Audio {
  unlock(): void;
  play(cue: SoundCue): void;
  playMusic(track: MusicTrack): void;
  isMuted(): boolean;
  toggleMute(): void;
}

export interface AudioParamLike {
  setValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: unknown): unknown;
}

export interface OscillatorLike extends AudioNodeLike {
  type: OscillatorType;
  frequency: AudioParamLike;
  start(time: number): void;
  stop(time: number): void;
}

export interface GainLike extends AudioNodeLike {
  gain: AudioParamLike;
}

export interface MusicElementLike {
  loop: boolean;
  currentTime: number;
  readonly paused: boolean;
  play(): Promise<void>;
  pause(): void;
}

export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: unknown;
  readonly state: string;
  resume(): Promise<void>;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  createMediaElementSource(element: MusicElementLike): AudioNodeLike;
}

interface Blip {
  readonly frequency: number;
  readonly endFrequency: number;
  readonly delay: number;
  readonly duration: number;
  readonly wave: "square" | "triangle" | "sawtooth";
}

const VOLUME = 0.08;
// Routed through a gain node because iOS ignores HTMLMediaElement.volume.
const MUSIC_VOLUME = 0.12;
const MUSIC_TRACKS: readonly MusicTrack[] = ["background", "fight"];
const SILENT = 0.0001;

export const BLIPS: Readonly<Record<SoundCue, readonly Blip[]>> = {
  footstep: [
    {
      frequency: 90,
      endFrequency: 60,
      delay: 0,
      duration: 0.04,
      wave: "triangle",
    },
  ],
  select: [
    {
      frequency: 660,
      endFrequency: 880,
      delay: 0,
      duration: 0.05,
      wave: "square",
    },
  ],
  hit: [
    {
      frequency: 220,
      endFrequency: 70,
      delay: 0,
      duration: 0.12,
      wave: "sawtooth",
    },
  ],
  encounter: [
    {
      frequency: 330,
      endFrequency: 330,
      delay: 0,
      duration: 0.08,
      wave: "square",
    },
    {
      frequency: 440,
      endFrequency: 440,
      delay: 0.09,
      duration: 0.08,
      wave: "square",
    },
    {
      frequency: 330,
      endFrequency: 330,
      delay: 0.18,
      duration: 0.08,
      wave: "square",
    },
    {
      frequency: 550,
      endFrequency: 550,
      delay: 0.27,
      duration: 0.14,
      wave: "square",
    },
  ],
  "self-destruct": [
    {
      frequency: 880,
      endFrequency: 110,
      delay: 0,
      duration: 0.5,
      wave: "sawtooth",
    },
    {
      frequency: 120,
      endFrequency: 40,
      delay: 0.5,
      duration: 0.3,
      wave: "square",
    },
  ],
};

function playBlips(context: AudioContextLike, blips: readonly Blip[]): void {
  for (const blip of blips) {
    const start = context.currentTime + blip.delay;
    const end = start + blip.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = blip.wave;
    oscillator.frequency.setValueAtTime(blip.frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(blip.endFrequency, end);
    gain.gain.setValueAtTime(VOLUME, start);
    gain.gain.exponentialRampToValueAtTime(SILENT, end);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end);
  }
}

function connectMusic(
  context: AudioContextLike,
  createMusicElement: (track: MusicTrack) => MusicElementLike,
): Readonly<Record<MusicTrack, MusicElementLike>> {
  const gain = context.createGain();
  gain.gain.setValueAtTime(MUSIC_VOLUME, context.currentTime);
  gain.connect(context.destination);
  function connect(track: MusicTrack): MusicElementLike {
    const element = createMusicElement(track);
    element.loop = true;
    context.createMediaElementSource(element).connect(gain);
    return element;
  }
  return { background: connect("background"), fight: connect("fight") };
}

export function createAudio(
  createContext: () => AudioContextLike | null,
  createMusicElement: (track: MusicTrack) => MusicElementLike,
): Audio {
  let context: AudioContextLike | null = null;
  let failed = false;
  let muted = false;
  let track: MusicTrack = "background";
  let music: Readonly<Record<MusicTrack, MusicElementLike>> | null = null;
  let musicFailed = false;

  function ensureContext(): AudioContextLike | null {
    if (context === null && !failed) {
      try {
        context = createContext();
      } catch {
        context = null;
      }
      failed = context === null;
    }
    return context;
  }

  function attempt(action: (ready: AudioContextLike) => void): void {
    const ready = ensureContext();
    if (ready === null) {
      return;
    }
    try {
      action(ready);
    } catch {
      failed = true;
      context = null;
    }
  }

  function syncMusic(): void {
    if (context === null || musicFailed) {
      return;
    }
    try {
      music ??= connectMusic(context, createMusicElement);
      for (const candidate of MUSIC_TRACKS) {
        const element = music[candidate];
        if (candidate !== track || muted) {
          element.pause();
        } else if (element.paused) {
          element.play().catch(() => undefined);
        }
      }
    } catch {
      musicFailed = true;
    }
  }

  return {
    unlock() {
      attempt((ready) => {
        if (ready.state === "suspended") {
          ready.resume().catch(() => {
            failed = true;
          });
        }
      });
      syncMusic();
    },
    play(cue) {
      if (muted || context === null) {
        return;
      }
      attempt((ready) => {
        playBlips(ready, BLIPS[cue]);
      });
    },
    playMusic(next) {
      if (next === track) {
        return;
      }
      track = next;
      if (music !== null && next === "fight") {
        music.fight.currentTime = 0;
      }
      syncMusic();
    },
    isMuted: () => muted,
    toggleMute() {
      muted = !muted;
      syncMusic();
    },
  };
}

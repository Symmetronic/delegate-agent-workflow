import {
  BLIPS,
  createAudio,
  type AudioContextLike,
  type MusicElementLike,
  type MusicTrack,
  type SoundCue,
} from "#/src/audio.ts";
import { createBattle } from "#/src/battle.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const CUES: readonly SoundCue[] = [
  "footstep",
  "select",
  "hit",
  "encounter",
  "self-destruct",
];

function fakeContext(state = "running") {
  const counts = { oscillators: 0, resumes: 0 };
  const param = {
    setValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  };
  const context: AudioContextLike = {
    currentTime: 0,
    destination: {},
    state,
    resume() {
      counts.resumes += 1;
      return Promise.resolve();
    },
    createOscillator() {
      counts.oscillators += 1;
      return {
        type: "square",
        frequency: param,
        connect: () => undefined,
        start: () => undefined,
        stop: () => undefined,
      };
    },
    createGain: () => ({ gain: param, connect: () => undefined }),
    createMediaElementSource: () => ({ connect: () => undefined }),
  };
  return { context, counts };
}

function fakeMusic() {
  const elements = new Map<MusicTrack, MusicElementLike>();
  function create(track: MusicTrack): MusicElementLike {
    const element: MusicElementLike = {
      loop: false,
      currentTime: 0,
      paused: true,
      play() {
        Object.assign(element, { paused: false });
        return Promise.resolve();
      },
      pause() {
        Object.assign(element, { paused: true });
      },
    };
    elements.set(track, element);
    return element;
  }
  function playing(): MusicTrack[] {
    return [...elements]
      .filter(([, element]) => !element.paused)
      .map(([track]) => track);
  }
  return { create, elements, playing };
}

const noMusic = fakeMusic().create;

describe("audio", () => {
  it("plays nothing before it is unlocked", () => {
    const { context, counts } = fakeContext();
    const audio = createAudio(() => context, noMusic);
    audio.play("hit");
    assert.equal(counts.oscillators, 0);
  });

  it("synthesizes every cue once unlocked", () => {
    for (const cue of CUES) {
      const { context, counts } = fakeContext();
      const audio = createAudio(() => context, noMusic);
      audio.unlock();
      audio.play(cue);
      assert.equal(counts.oscillators, BLIPS[cue].length);
    }
  });

  it("resumes a suspended context on unlock", () => {
    const { context, counts } = fakeContext("suspended");
    createAudio(() => context, noMusic).unlock();
    assert.equal(counts.resumes, 1);
  });

  it("is silent while muted and sounds again after unmuting", () => {
    const { context, counts } = fakeContext();
    const audio = createAudio(() => context, noMusic);
    audio.unlock();
    audio.toggleMute();
    assert.equal(audio.isMuted(), true);
    audio.play("select");
    assert.equal(counts.oscillators, 0);
    audio.toggleMute();
    audio.play("select");
    assert.equal(counts.oscillators, 1);
  });

  it("survives a browser without audio", () => {
    const missing = createAudio(() => null, noMusic);
    missing.unlock();
    missing.play("hit");
    const refusing = createAudio(() => {
      throw new Error("refused");
    }, noMusic);
    refusing.unlock();
    refusing.play("hit");
    assert.equal(refusing.isMuted(), false);
  });

  it("survives a context that throws while playing", () => {
    const { context } = fakeContext();
    context.createOscillator = () => {
      throw new Error("broken");
    };
    const audio = createAudio(() => context, noMusic);
    audio.unlock();
    audio.play("hit");
  });
});

describe("music", () => {
  it("plays nothing before it is unlocked", () => {
    const { context } = fakeContext();
    const music = fakeMusic();
    const audio = createAudio(() => context, music.create);
    audio.playMusic("fight");
    assert.deepEqual(music.playing(), []);
  });

  it("loops the background track once unlocked", () => {
    const { context } = fakeContext();
    const music = fakeMusic();
    createAudio(() => context, music.create).unlock();
    assert.deepEqual(music.playing(), ["background"]);
    assert.equal(music.elements.get("background")?.loop, true);
    assert.equal(music.elements.get("fight")?.loop, true);
  });

  it("switches to the fight track and back", () => {
    const { context } = fakeContext();
    const music = fakeMusic();
    const audio = createAudio(() => context, music.create);
    audio.unlock();
    audio.playMusic("fight");
    assert.deepEqual(music.playing(), ["fight"]);
    audio.playMusic("background");
    assert.deepEqual(music.playing(), ["background"]);
  });

  it("starts the fight track from the beginning for every fight", () => {
    const { context } = fakeContext();
    const music = fakeMusic();
    const audio = createAudio(() => context, music.create);
    audio.unlock();
    audio.playMusic("fight");
    const fight = music.elements.get("fight");
    assert.ok(fight !== undefined);
    fight.currentTime = 42;
    audio.playMusic("background");
    audio.playMusic("fight");
    assert.equal(fight.currentTime, 0);
  });

  it("is silent while muted and plays again after unmuting", () => {
    const { context } = fakeContext();
    const music = fakeMusic();
    const audio = createAudio(() => context, music.create);
    audio.unlock();
    audio.toggleMute();
    assert.deepEqual(music.playing(), []);
    audio.playMusic("fight");
    assert.deepEqual(music.playing(), []);
    audio.toggleMute();
    assert.deepEqual(music.playing(), ["fight"]);
  });

  it("retries a refused track on the next unlock", () => {
    const { context } = fakeContext();
    const music = fakeMusic();
    const audio = createAudio(() => context, music.create);
    audio.unlock();
    const fight = music.elements.get("fight");
    assert.ok(fight !== undefined);
    const play = fight.play.bind(fight);
    fight.play = () => Promise.reject(new Error("not allowed"));
    audio.playMusic("fight");
    assert.deepEqual(music.playing(), []);
    fight.play = play;
    audio.unlock();
    assert.deepEqual(music.playing(), ["fight"]);
  });

  it("keeps the sound effects when music cannot be connected", () => {
    const { context, counts } = fakeContext();
    context.createMediaElementSource = () => {
      throw new Error("unsupported");
    };
    const audio = createAudio(() => context, noMusic);
    audio.unlock();
    audio.playMusic("fight");
    audio.play("hit");
    assert.equal(counts.oscillators, BLIPS.hit.length);
  });
});

describe("battle self-destruct flag", () => {
  it("is false at the start of a battle", () => {
    assert.equal(createBattle(() => 0).selfDestructed(), false);
  });
});

describe("battle self-destruct flag (triggered)", () => {
  it("is true after a self-destruct", () => {
    const battle = createBattle(() => 0);
    while (battle.phase() === "message") {
      battle.advance();
    }
    battle.choose(0);
    assert.equal(battle.selfDestructed(), true);
  });
});

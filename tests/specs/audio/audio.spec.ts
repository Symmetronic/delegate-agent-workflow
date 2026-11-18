import {
  BLIPS,
  createAudio,
  type AudioContextLike,
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
  };
  return { context, counts };
}

describe("audio", () => {
  it("plays nothing before it is unlocked", () => {
    const { context, counts } = fakeContext();
    const audio = createAudio(() => context);
    audio.play("hit");
    assert.equal(counts.oscillators, 0);
  });

  it("synthesizes every cue once unlocked", () => {
    for (const cue of CUES) {
      const { context, counts } = fakeContext();
      const audio = createAudio(() => context);
      audio.unlock();
      audio.play(cue);
      assert.equal(counts.oscillators, BLIPS[cue].length);
    }
  });

  it("resumes a suspended context on unlock", () => {
    const { context, counts } = fakeContext("suspended");
    createAudio(() => context).unlock();
    assert.equal(counts.resumes, 1);
  });

  it("is silent while muted and sounds again after unmuting", () => {
    const { context, counts } = fakeContext();
    const audio = createAudio(() => context);
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
    const missing = createAudio(() => null);
    missing.unlock();
    missing.play("hit");
    const refusing = createAudio(() => {
      throw new Error("refused");
    });
    refusing.unlock();
    refusing.play("hit");
    assert.equal(refusing.isMuted(), false);
  });

  it("survives a context that throws while playing", () => {
    const { context } = fakeContext();
    context.createOscillator = () => {
      throw new Error("broken");
    };
    const audio = createAudio(() => context);
    audio.unlock();
    audio.play("hit");
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

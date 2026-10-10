"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

// A minor, F, C, G: note frequencies in Hz, low to high.
const CHORDS = [
  { name: "Am", notes: [220.0, 261.63, 329.63], heights: [3, 5, 8] },
  { name: "F", notes: [174.61, 220.0, 261.63], heights: [1, 3, 5] },
  { name: "C", notes: [261.63, 329.63, 392.0], heights: [5, 8, 10] },
  { name: "G", notes: [196.0, 246.94, 293.66], heights: [2, 4, 7] },
];
const BEAT_MS = 900;

/** Four chord pads and a play button. Sound is made in the browser with Web Audio. */
export function ProgressionPlayer() {
  const audio = useRef<AudioContext | null>(null);
  const timers = useRef<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const stop = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPlaying(false);
    setActive(null);
  };

  useEffect(() => stop, []);

  const strum = (index: number) => {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    audio.current ??= new AudioCtor();
    const ctx = audio.current;
    void ctx.resume();

    CHORDS[index].notes.forEach((frequency, note) => {
      const start = ctx.currentTime + note * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.2);
    });
    setActive(index);
  };

  const play = () => {
    if (playing) return stop();
    setPlaying(true);
    // Twice through the progression.
    for (let beat = 0; beat < CHORDS.length * 2; beat++) {
      timers.current.push(window.setTimeout(() => strum(beat % CHORDS.length), beat * BEAT_MS));
    }
    timers.current.push(window.setTimeout(stop, CHORDS.length * 2 * BEAT_MS + 300));
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {CHORDS.map((chord, index) => (
          <button
            key={chord.name}
            type="button"
            onClick={() => strum(index)}
            aria-label={`Play ${chord.name} chord`}
            className={cn(
              "group flex h-28 flex-col justify-between rounded-lg border p-2.5 text-left transition-colors active:scale-[0.98]",
              active === index ? "border-brand bg-brand/10" : "border-border bg-background hover:border-foreground/30"
            )}
          >
            <span className="flex h-12 items-end gap-1" aria-hidden>
              {chord.heights.map((height) => (
                <span
                  key={height}
                  style={{ height: `${height * 10}%` }}
                  className={cn(
                    "w-1.5 rounded-full transition-colors",
                    active === index ? "bg-brand" : "bg-foreground/25 group-hover:bg-foreground/50"
                  )}
                />
              ))}
            </span>
            <span className="font-mono text-sm text-foreground">{chord.name}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={play}
        aria-pressed={playing}
        className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground/30 active:scale-[0.98]"
      >
        <span aria-hidden className={cn("size-2", playing ? "bg-brand" : "rounded-full bg-brand")} />
        {playing ? "Stop" : "Play the progression"}
      </button>
    </div>
  );
}

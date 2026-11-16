import { detectPitch } from "./yin";

type Inbound = { samples: Float32Array; sampleRate: number };

type Outbound =
  | { type: "progress"; ratio: number }
  | { type: "done"; t0: number; dt: number; freq: Float32Array }
  | { type: "error"; message: string };

const scope = globalThis as typeof globalThis & {
  onmessage: ((event: MessageEvent<Inbound>) => void) | null;
  postMessage: (message: Outbound, transfer?: Transferable[]) => void;
};

scope.onmessage = (event) => {
  try {
    const track = detectPitch(event.data.samples, event.data.sampleRate, (ratio) => {
      scope.postMessage({ type: "progress", ratio });
    });
    scope.postMessage({ type: "done", t0: track.t0, dt: track.dt, freq: track.freq }, [track.freq.buffer]);
  } catch (error) {
    scope.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Pitch detection failed",
    });
  }
};

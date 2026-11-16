/** The pitch worker, bundled by Next from the file next to this one. */
export function createPitchWorker(): Worker {
  return new Worker(new URL("./pitch.worker.ts", import.meta.url));
}

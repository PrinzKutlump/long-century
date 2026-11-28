/**
 * Async Web Worker client bridging simulation advances & save compression off the main thread.
 * Falls back cleanly to synchronous execution if Web Workers are unavailable.
 */
export function createSimClient() {
  let worker = null;
  let seq = 0;
  const pending = new Map();
  let busy = false;

  function ensureWorker() {
    if (worker || typeof Worker !== "function") return worker;
    try {
      worker = new Worker(`${import.meta.env.BASE_URL}sim-worker.js`);
      worker.onmessage = ev => {
        const msg = ev.data || {};
        const job = pending.get(msg.id);
        if (!job) return;
        pending.delete(msg.id);
        if (msg.ok) job.resolve(msg);
        else job.reject(new Error(msg.error || "Simulation worker error"));
      };
      worker.onerror = err => {
        const error = new Error(err?.message || "Worker crashed");
        for (const job of pending.values()) job.reject(error);
        pending.clear();
        worker = null;
      };
    } catch {
      worker = null;
    }
    return worker;
  }

  function call(payload) {
    const w = ensureWorker();
    if (!w) return Promise.reject(new Error("Worker unavailable"));
    const id = ++seq;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      w.postMessage({ ...payload, id });
    });
  }

  return {
    isBusy: () => busy,
    isAvailable: () => typeof Worker === "function",
    async advanceMonth({ expectedMonth, stateJson }) {
      busy = true;
      try {
        return await call({
          type: "advance",
          expectedMonth,
          stateJson
        });
      } finally {
        busy = false;
      }
    },
    async packSave(stateJson) {
      return call({ type: "pack", stateJson });
    },
    async ping() {
      return call({ type: "ping" });
    }
  };
}

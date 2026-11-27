/* Web Worker simulation runtime for The Long Century.
   Runs heavy campaign initialization, monthly simulation ticks, and save compression off the main UI thread. */
const W_SKIP = new Set([
  "grainFreight", "plist", "_n", "_craUn", "_a", "_gross", "_art", "_im", "_inc",
  "_ari", "_cap", "_gdp", "_govPay", "_works", "_causes", "_bqDoneMonth", "_playerState", "employerAccount"
]);
const W_SAVE_OWN_ONLY = new Set(["localMarket", "landUse"]);
const W_SAVE_SCHEMA = 3;
const W_SAVE_RULESET = "classic";

function workerLiveSnapshotJSON() {
  return JSON.stringify(
    { ...G, nextArmyId: UID },
    function (key, value) {
      return key === "plist" ? undefined : value;
    }
  );
}

function workerSaveJSON() {
  return JSON.stringify(
    { ...G, nextArmyId: UID, saveSchema: W_SAVE_SCHEMA, modelRev: MODEL_REV, ruleset: W_SAVE_RULESET },
    function (key, value) {
      return W_SKIP.has(key) || (W_SAVE_OWN_ONLY.has(key) && this.o !== G.player) ? undefined : value;
    }
  );
}

const W_LZC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function workerEncodeSaveBytes(bytes) {
  if (bytes.toBase64) return bytes.toBase64({ alphabet: "base64url", omitPadding: true });
  const chunks = [];
  let part = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const word = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    part += W_LZC[word >>> 18] + W_LZC[(word >>> 12) & 63] + W_LZC[(word >>> 6) & 63] + W_LZC[word & 63];
    if (part.length >= 8192) {
      chunks.push(part);
      part = "";
    }
  }
  if (i < bytes.length) {
    const word = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8);
    part += W_LZC[word >>> 18] + W_LZC[(word >>> 12) & 63];
    if (i + 1 < bytes.length) part += W_LZC[(word >>> 6) & 63];
  }
  chunks.push(part);
  return chunks.join("");
}

function workerDecodeSaveBytes(text) {
  const lookup = new Int8Array(128).fill(-1);
  for (let i = 0; i < W_LZC.length; i++) lookup[W_LZC.charCodeAt(i)] = i;
  if (text.length % 4 === 1) throw new Error("bad save encoding");
  const bytes = new Uint8Array(Math.floor((text.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (let i = 0; i < text.length; i++) {
    const value = lookup[text.charCodeAt(i)];
    if (value === undefined || value < 0) throw new Error("bad save encoding");
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset++] = buffer >>> bits;
    }
  }
  return bytes;
}

function workerLzDec(z) {
  const idx = {};
  for (let i = 0; i < 64; i++) idx[W_LZC[i]] = i;
  const d = [];
  let next = 256, bits = 9, buf = 0, nb = 0, pos = 0;
  const read = () => {
    while (nb < bits && pos < z.length) {
      buf |= idx[z[pos++]] << nb;
      nb += 6;
    }
    if (nb < bits) return -1;
    const c = buf & ((1 << bits) - 1);
    buf >>>= bits;
    nb -= bits;
    return c;
  };
  const str = c => (c < 256 ? String.fromCharCode(c) : d[c - 256]);
  let c = read();
  if (c < 0) return "";
  let w = str(c);
  const out = [w];
  for (;;) {
    if (next < 65535) {
      next++;
      if (next > 1 << bits && bits < 16) bits++;
    } else if (next === 65535) {
      next = 65536;
    }
    c = read();
    if (c < 0) break;
    let e;
    if (c < 256 || d[c - 256] !== undefined) e = str(c);
    else e = w + w[0];
    out.push(e);
    if (d.length < 65535 - 256) d.push(w + e[0]);
    w = e;
  }
  return out.join("");
}

function workerCompressSave(json) {
  return "V2:" + workerEncodeSaveBytes(SAVE_COMPRESSION.deflate(json, { level: 2 }));
}

function workerReadSaveJSON(text) {
  if (text.startsWith("V2:")) return SAVE_COMPRESSION.inflate(workerDecodeSaveBytes(text.slice(3)), { to: "string" });
  if (text.startsWith("V1:")) return workerLzDec(text.slice(3));
  return text;
}

function workerRestoreFromObj(g) {
  if (!g || !g.prov || !g.c || !Number.isInteger(g.t) || g.t < 0 || !g.price) {
    throw new Error("bad worker state");
  }
  g.plist = WORLD.provs.map(w => g.prov[w.id]);
  const lanes = g.lanes || [];
  const next = 1 + Math.max(0, ...(g.armies || []).map(a => +a.id.slice(1) || 0));
  g.pricePrev = g.pricePrev || { ...g.price };
  buildAdj();
  for (const [a, b, m] of lanes) {
    if (!SEAADJ[a].some(x => x[0] === b)) {
      SEAADJ[a].push([b, m]);
      SEAADJ[b].push([a, m]);
    }
  }
  UID = Number.isSafeInteger(g.nextArmyId) ? Math.max(next, g.nextArmyId) : next;
  delete g.nextArmyId;
  _SL = { landAt: {}, navAt: {}, navP: {}, c: {} };
  if (typeof migrateGameState === "function") migrateGameState(g);
  G = g;
  return g;
}

self.onmessage = function (ev) {
  const msg = ev.data || {};
  const id = msg.id;
  try {
    if (msg.type === "ping") {
      self.postMessage({ id, ok: true, modelRev: MODEL_REV });
      return;
    }
    if (msg.type === "newGame") {
      newGame(msg.tag || null, msg.seed);
      self.postMessage({ id, ok: true, stateJson: workerLiveSnapshotJSON() });
      return;
    }
    if (msg.type === "sync") {
      const g = JSON.parse(msg.stateJson);
      workerRestoreFromObj(g);
      self.postMessage({ id, ok: true, t: G.t });
      return;
    }
    if (msg.type === "advance") {
      if (msg.stateJson) {
        workerRestoreFromObj(JSON.parse(msg.stateJson));
      }
      const res = advanceCampaign(msg.expectedMonth);
      const stateJson = workerLiveSnapshotJSON();
      const packedSave = workerCompressSave(workerSaveJSON());
      self.postMessage({
        id,
        ok: true,
        t: G.t,
        challengeEnded: !!res.challengeEnded,
        reportDone: !!res.reportDone,
        stateJson,
        packedSave
      });
      return;
    }
    if (msg.type === "pack") {
      if (msg.stateJson) {
        workerRestoreFromObj(JSON.parse(msg.stateJson));
      }
      const packedSave = workerCompressSave(workerSaveJSON());
      self.postMessage({ id, ok: true, packedSave });
      return;
    }
    if (msg.type === "unpack") {
      const jsonText = workerReadSaveJSON(String(msg.saveText || ""));
      const g = JSON.parse(jsonText);
      delete g.saveSchema;
      delete g.modelRev;
      delete g.ruleset;
      workerRestoreFromObj(g);
      self.postMessage({ id, ok: true, stateJson: workerLiveSnapshotJSON() });
      return;
    }
    self.postMessage({ id, ok: false, error: "Unknown worker message: " + msg.type });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err && err.message ? err.message : String(err) });
  }
};

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

const LEGACY_KEYS = [
  "vic.auto", "vic.autoM", "vic.slot",
  "vic.s1", "vic.s2", "vic.s3",
  "vic.s1m", "vic.s2m", "vic.s3m"
];

function safeKeyToFile(key) {
  return String(key).replace(/[^a-z0-9._-]/gi, "_") + ".json";
}

/**
 * Storage v2:
 * - Native Android (Capacitor): mirrors every save in Directory.Data/saves/ + IndexedDB
 * - Web / PWA: stores in IndexedDB ("vic" / objectStore "s") with persistent storage request
 * - Legacy migration: silently imports older localStorage keys into IndexedDB/native storage
 *   without blocking UI or calling confirm().
 */
export function createStorageAdapter() {
  const mem = {};
  let db = null;
  let initialized = false;
  let migratedLegacyCount = 0;

  const isNative = () => {
    try {
      return !!Capacitor?.isNativePlatform?.();
    } catch {
      return false;
    }
  };

  const openIdb = () =>
    new Promise(resolve => {
      try {
        if (typeof indexedDB === "undefined") return resolve(null);
        const req = indexedDB.open("vic", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("s")) {
            req.result.createObjectStore("s");
          }
        };
        req.onsuccess = () => {
          db = req.result;
          resolve(db);
        };
        req.onerror = req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

  const txIdb = (mode, fn) =>
    new Promise((resolve, reject) => {
      if (!db) return reject(new Error("no store"));
      try {
        const t = db.transaction("s", mode);
        fn(t.objectStore("s"));
        t.oncomplete = () => resolve();
        t.onerror = t.onabort = () => reject(t.error || new Error("write failed"));
      } catch (err) {
        reject(err);
      }
    });

  async function readNativeDir() {
    if (!isNative()) return;
    try {
      await Filesystem.mkdir({
        path: "saves",
        directory: Directory.Data,
        recursive: true
      }).catch(() => {});
      const list = await Filesystem.readdir({
        path: "saves",
        directory: Directory.Data
      });
      for (const entry of list.files || []) {
        const name = typeof entry === "string" ? entry : entry.name;
        if (!name || !name.endsWith(".json")) continue;
        try {
          const res = await Filesystem.readFile({
            path: `saves/${name}`,
            directory: Directory.Data,
            encoding: Encoding.UTF8
          });
          const parsed = JSON.parse(String(res.data || "{}"));
          if (parsed && parsed.key && parsed.val !== undefined) {
            mem[parsed.key] = parsed.val;
          }
        } catch {
          // Skip malformed individual save file
        }
      }
    } catch {
      // Ignore native filesystem unavailable fallback
    }
  }

  async function writeNativeKey(key, val) {
    if (!isNative()) return;
    try {
      await Filesystem.mkdir({
        path: "saves",
        directory: Directory.Data,
        recursive: true
      }).catch(() => {});
      await Filesystem.writeFile({
        path: `saves/${safeKeyToFile(key)}`,
        data: JSON.stringify({ key, val, updatedAt: Date.now() }),
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
    } catch {
      // IndexedDB remains primary mirror if native write fails
    }
  }

  async function deleteNativeKey(key) {
    if (!isNative()) return;
    try {
      await Filesystem.deleteFile({
        path: `saves/${safeKeyToFile(key)}`,
        directory: Directory.Data
      });
    } catch {
      // Ignore missing native file
    }
  }

  async function migrateLegacyLocalStorage() {
    try {
      if (typeof localStorage === "undefined") return;
      const found = {};
      for (const k of LEGACY_KEYS) {
        const v = localStorage.getItem(k);
        if (v != null) found[k] = v;
      }
      const keys = Object.keys(found);
      if (!keys.length) return;
      for (const k of keys) {
        if (mem[k] === undefined) {
          mem[k] = found[k];
          migratedLegacyCount++;
          if (db) {
            await txIdb("readwrite", s => s.put(found[k], k)).catch(() => {});
          }
          await writeNativeKey(k, found[k]);
        }
        localStorage.removeItem(k);
      }
    } catch {
      // Safe no-op in sandboxed storage
    }
  }

  return {
    m: mem,
    async init() {
      if (initialized) return;
      initialized = true;
      await openIdb();
      if (db) {
        await new Promise(resolve => {
          try {
            const q = db.transaction("s").objectStore("s").openCursor();
            q.onsuccess = () => {
              const c = q.result;
              if (c) {
                mem[c.key] = c.value;
                c.continue();
              } else {
                resolve();
              }
            };
            q.onerror = () => resolve();
          } catch {
            resolve();
          }
        });
      }
      await readNativeDir();
      try {
        if (typeof navigator !== "undefined" && navigator.storage?.persist) {
          navigator.storage.persist().catch(() => {});
        }
      } catch {
        // Ignore permission unavailability
      }
      await migrateLegacyLocalStorage();
    },
    get(k) {
      return mem[k] === undefined ? null : mem[k];
    },
    async set(k, v) {
      const old = mem[k];
      mem[k] = v;
      try {
        if (db) {
          await txIdb("readwrite", s => s.put(v, k));
        }
        await writeNativeKey(k, v);
      } catch (err) {
        if (!isNative()) {
          if (old === undefined) delete mem[k];
          else mem[k] = old;
          throw err;
        }
        await writeNativeKey(k, v);
      }
    },
    async del(k) {
      delete mem[k];
      if (db) {
        await txIdb("readwrite", s => s.delete(k)).catch(() => {});
      }
      await deleteNativeKey(k);
    },
    stats() {
      return {
        native: isNative(),
        hasIdb: !!db,
        migratedLegacyCount,
        keys: Object.keys(mem)
      };
    }
  };
}

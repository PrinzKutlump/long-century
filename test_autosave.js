"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("dist/long-century.html", "utf8")
 .match(/<script>([\s\S]*)<\/script>/)[1];
const storage = new Map();
const context = vm.createContext({
 assert, console, Blob, CompressionStream, Response, setTimeout,
 window: { addEventListener() {} },
 document: { addEventListener() {} },
 localStorage: { setItem: (key, value) => storage.set(key, value), getItem: key => storage.get(key) }
});
vm.runInContext(source, context);
vm.runInContext(`
(async () => {
 newGame("SWI", 7);
 const january = autosave();
 G.t = 1;
 const february = autosave();
 await Promise.all([february, january]);
 const saved = JSON.parse(readSaveJSON(localStorage.getItem("vic.auto")));
 assert.equal(saved.t, 1);
 assert.equal(UI.lastAutosave, 1);
 assert.equal(JSON.parse(localStorage.getItem("vic.autoM")).t, 1);

 const stale = autosave();
 newGame("PUN", 7);
 await stale;
 assert.equal(JSON.parse(readSaveJSON(localStorage.getItem("vic.auto"))).player, "SWI");

 G.t = 2;
 const pending = autosave();
 flushAutosave(pendingAutosave);
 assert.equal(JSON.parse(readSaveJSON(localStorage.getItem("vic.auto"))).t, 2);
 await pending;
 assert.equal(UI.lastAutosave, 2);
 // End month: the autosave is written after the frame, and a hidden page writes it at once.
 G.t = 3;
 autosaveSoon();
 assert.equal(UI.lastAutosave, 2);
 G.t = 4;
 const late = pendingAutosave;
 autosaveSoon();
 assert.notEqual(pendingAutosave, late);
 flushAutosave(pendingAutosave);
 assert.equal(UI.lastAutosave, 4);
 assert.equal(JSON.parse(readSaveJSON(localStorage.getItem("vic.auto"))).t, 4);
 G.t = 5;
 autosaveSoon();
 await new Promise(r => setTimeout(r, 5));
 while (UI.lastAutosave !== 5) await new Promise(r => setTimeout(r, 5));
 assert.equal(JSON.parse(localStorage.getItem("vic.autoM")).t, 5);
 console.log("PASS deferred end-month autosave, flushed on hide and written after the frame.");
 console.log("PASS native compression, newest autosave wins, stale campaign isolation and page-hide flush.");
})()
`, context).catch(error => {
 console.error(error);
 process.exitCode = 1;
});

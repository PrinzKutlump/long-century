"use strict";
const { readdirSync, existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");

/* --quiet (or LC_QUIET=1): print one summary line; the full table and failure output go to /tmp/lc_last_run.txt */
const quiet = process.argv.includes("--quiet") || process.env.LC_QUIET === "1";
const transcript = [];
const say = (...parts) => quiet ? transcript.push(parts.join(" ")) : console.log(...parts);
const write = text => quiet ? transcript.push(text) : process.stdout.write(text);
const writeErr = text => quiet ? transcript.push(text) : process.stderr.write(text);
const failedNames = [];
let failures = 0, ran = 0;
say("Test                         Result      Seconds");
for (const name of readdirSync(__dirname).filter(name => /^test_.*\.js$/.test(name)).sort()) {
 const started = performance.now();
 ran++;
 const run = spawnSync(process.execPath, [name], { cwd: __dirname, encoding: "utf8" });
 const failed = run.status !== 0 || /^(?:FAIL\b|FAILED\b|ERROR\b)/m.test(run.stdout || "");
 say(name.padEnd(29), failed ? "FAIL      " : "PASS      ", ((performance.now() - started) / 1000).toFixed(1));
 if (failed) {
  failures++;
  failedNames.push(name);
  write(run.stdout || "");
  writeErr(run.stderr || "");
  if (run.error) quiet ? transcript.push(String(run.error)) : console.error(run.error);
 }
}
/* V2c.8: the browser layout check runs whenever Chrome is installed (it needs dist/long-century.html, so run build.py first) */
if (existsSync("/usr/bin/google-chrome") && existsSync(__dirname + "/dist/long-century.html")) {
 const started = performance.now();
 ran++;
 const run = spawnSync("python3", ["tools/layout_check.py"], { cwd: __dirname, encoding: "utf8" });
 const failed = run.status !== 0;
 say("layout_check.py".padEnd(29), failed ? "FAIL      " : "PASS      ", ((performance.now() - started) / 1000).toFixed(1));
 if (failed) { failures++; failedNames.push("layout_check.py"); write(run.stdout || ""); writeErr(run.stderr || ""); if (run.error) quiet ? transcript.push(String(run.error)) : console.error(run.error); }
}
if (quiet) {
 const { writeFileSync } = require("node:fs");
 writeFileSync("/tmp/lc_last_run.txt", transcript.join("\n") + "\n");
 console.log(failures ? `FAIL ${failures} of ${ran} (${failedNames.join(", ")}); full output /tmp/lc_last_run.txt`
   : `PASS ${ran} checks; full output /tmp/lc_last_run.txt`);
}
process.exitCode = failures ? 1 : 0;

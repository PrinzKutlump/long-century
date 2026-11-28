"use strict";

const fixture = require("./load_test_engine")(`
 globalThis.run = () => {
  newGame(null, 3);
  const factory = G.plist.find(p => p.o && G.c[p.o].alive && p.factories.some(f => f._out > 0))
    .factories.find(f => f._out > 0);
  factory.lv = 0;
  Object.assign(factory, {_out: 100, _e: 1, _im: 1.2, _pr: 10, _limitingInput: "coal", _inputFill: 0.4});
  monthTick();
  return {
   scratch: [factory._out, factory._e, factory._im, factory._pr, factory._limitingInput, factory._inputFill],
   account: factory.employerAccount,
   phantomOutput: G.plist.some(p => p.factories.some(f => f.lv <= 0 && f._out > 0))
  };
 };
`);

const assert = require("node:assert/strict");
const result = fixture.run();
assert.deepEqual(result.scratch, [0, 0, 1, 0, null, 0]);
assert.deepEqual(result.account, {revenue: 0, inputs: 0, wages: 0, profit: 0});
assert.equal(result.phantomOutput, false);
console.log("FX1: level-zero factory output and settlement cleared");

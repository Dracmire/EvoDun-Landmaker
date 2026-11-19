/* STAGE 3 CONSTRUCTOR (DAC3): THE NAMESPACE AND ITS SEAL (docs/crystallizers/03-stage/research/octopath2/stage_s3_sello_go.md, rule of [U] 2026-11-19, A520-A522). Loaded BEFORE the clones.
   `window.EVO.s3` inherits from `window.EVO` so the tools that are not the DAC chain (render, tech, curves, fields, png, cameras...) stay shared. The names of the DAC chain are the exception: `shape`, `rooms`, `roomTypes`, `pocket` and the helpers that src/shape.js exports are defined here as TRAPS that THROW if they are read before a clone defines them,
   so the prototype can never hand the original chain to mode 3 (a missing clone is an error, not a silent fall back). A clone that assigns the name (`E.shape = ...` inside src/s3/shape.js, where `E` is E.s3) replaces the trap with a plain own property. NOTHING of the original files is edited. */
(function (E0) {
  const E = E0.s3 || (E0.s3 = Object.create(E0));
  const CHAIN = ['shape', 'rooms', 'roomTypes', 'pocket', '_carve', 'gateTransitions', 'hOf', 'landFill', 'linkProtect', 'noisePack', 'quantize', 'rampHeight', 'regionGap', 'route', 'sliceOf', 'subHeight', 'terBase', 'terGap', 'tileWalkable', 'walkGraph', 'zonePieces'];
  for (const n of CHAIN) Object.defineProperty(E, n, { configurable: true, enumerable: true,
    get() { throw new Error(`E.s3.${n} is not defined by a DAC3 clone (src/s3/): mode 3 never falls back to the original DAC chain (stage_s3_sello_go.md)`); },
    set(v) { Object.defineProperty(E, n, { value: v, writable: true, configurable: true, enumerable: true }); } });
  E.CHAIN_NAMES = CHAIN;
})(window.EVO = window.EVO || {});

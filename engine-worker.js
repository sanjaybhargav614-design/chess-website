// =====================================================================
// Stockfish WebAssembly Web Worker (engine-worker.js)
// Runs the Stockfish chess engine in a dedicated background worker
// Communicates via standard Universal Chess Interface (UCI)
// =====================================================================

(function() {
    'use strict';

    var loaded = false;
    try {
        importScripts('stockfish.js');
        loaded = true;
    } catch (e) {
        console.error('[EngineWorker] stockfish.js not found in the project root:', e && e.message ? e.message : e);
    }

    if (!loaded) {
        self.postMessage('info string Error: stockfish.js could not be loaded. Keep the local engine file next to index.html and refresh the page.');
    }
})();


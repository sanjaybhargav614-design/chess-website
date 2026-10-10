// ============================================================================
// EVALUATION WORKER (eval-worker.js)
// ============================================================================
// Purpose
// -------
// Supplies a static evaluation of a single position WITHOUT blocking the UI
// thread and WITHOUT starting a second search.
//
// It deliberately reuses the project's existing evaluation function
// (`evaluateBoard` in bot-engine.js — the same code the custom bot plays with)
// so there is exactly one evaluation implementation in the codebase. It only
// reads the board; it never searches, never moves pieces and never spawns
// other workers.
//
// Protocol
// --------
//   in : { fen: string, token: number }
//   out: { fen: string, token: number, cp: number }
//
// `cp` is in centipawns from WHITE's perspective (positive = White is better),
// matching the convention used by the UCI engine and by bot-engine.js.
// ============================================================================

importScripts('bot-engine.js');

/**
 * Convert the piece-placement field of a FEN into the 8x8 character board that
 * `evaluateBoard` expects (row 0 = rank 8, '.' = empty).
 * Implemented locally so this worker needs no chess.js dependency.
 */
function fenToBoard(fen) {
    var placement = String(fen || '').split(' ')[0];
    var ranks = placement.split('/');
    var board = [];

    for (var r = 0; r < 8; r++) {
        var row = [];
        var line = ranks[r] || '8';

        for (var i = 0; i < line.length; i++) {
            var ch = line.charAt(i);
            if (ch >= '1' && ch <= '8') {
                var empties = parseInt(ch, 10);
                for (var e = 0; e < empties; e++) row.push('.');
            } else {
                row.push(ch);
            }
        }

        while (row.length < 8) row.push('.');
        board.push(row.slice(0, 8));
    }

    return board;
}

self.onmessage = function (e) {
    var data = e.data || {};
    var fen = data.fen;
    if (!fen) return;

    var cp = 0;
    try {
        cp = evaluateBoard(fenToBoard(fen));
        if (!isFinite(cp)) cp = 0;
    } catch (err) {
        cp = 0;
    }

    self.postMessage({ fen: fen, token: data.token, cp: cp });
};

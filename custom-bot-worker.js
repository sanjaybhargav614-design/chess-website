// Runs the custom bot engine's search in a background thread so the page
// (and tap-to-move) never freezes while it's calculating.
importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');
importScripts('bot-engine.js');

self.onmessage = function(e) {
    var data = e.data || {};
    var chessInstance = new Chess(data.fen);
    var result = findCustomBotMove(chessInstance, data.depth);

    if (result && result.move) {
        self.postMessage({
            move: {
                from: result.move.from,
                to: result.move.to,
                promotion: result.move.promotion || null,
                san: result.move.san
            },
            score: result.score,
            nodes: result.nodes
        });
    } else {
        self.postMessage({ move: null });
    }
};

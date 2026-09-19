// =====================================================================
// OPENING BOOK / THEORY DATABASE
// Master opening lines + lookup helpers. No DOM code lives here.
// =====================================================================

const masterOpenings = [
    // --- Open Game (1. e4 e5) ---
    { name: "Ruy Lopez: Morphy Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O"] },
    { name: "Ruy Lopez: Berlin Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "d4", "Nd6", "Bxc6", "dxc6", "dxe5", "Nf5"] },
    { name: "Ruy Lopez: Open Variation", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Nxe4", "d4", "b5", "Bb3", "d5", "dxe5", "Be6"] },
    { name: "Ruy Lopez: Marshall Attack", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5"] },
    { name: "Ruy Lopez: Steinitz Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "d6", "d4", "Bd7", "Nc3", "Nf6"] },
    { name: "Ruy Lopez: Schliemann Gambit", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "f5", "Nc3", "fxe4", "Nxe4", "d5"] },
    { name: "Italian Game: Giuoco Piano", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2"] },
    { name: "Italian Game: Giuoco Pianissimo", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3", "Nf6", "c3", "d6", "O-O", "a6"] },
    { name: "Italian Game: Two Knights Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Na5", "Bb5+", "c6", "dxc6", "bxc6"] },
    { name: "Italian Game: Evans Gambit", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5", "d4", "exd4", "O-O"] },
    { name: "Scotch Game: Classical", moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3", "Qf6", "c3", "Nge7"] },
    { name: "Scotch Game: Mieses Variation", moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nxc6", "bxc6", "e5", "Qe7", "Qe2", "Nd5"] },
    { name: "Four Knights Game", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bb5", "Bb4", "O-O", "O-O", "d3", "d6"] },
    { name: "Petrov's Defense", moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4", "d5", "Bd3", "Be7", "O-O"] },
    { name: "King's Gambit Accepted", moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "Bc4", "Bg7", "O-O", "h6", "d4", "d6"] },
    { name: "King's Gambit Declined", moves: ["e4", "e5", "f4", "Bc5", "Nf3", "d6", "c3", "Nf6", "d4", "exd4"] },
    { name: "Vienna Game", moves: ["e4", "e5", "Nc3", "Nf6", "f4", "d5", "fxe5", "Nxe4", "Nf3", "Be7"] },
    { name: "Philidor Defense", moves: ["e4", "e5", "Nf3", "d6", "d4", "exd4", "Nxd4", "Nf6", "Nc3", "Be7", "Be2", "O-O"] },
    { name: "Bishop's Opening", moves: ["e4", "e5", "Bc4", "Nf6", "d3", "c6", "Nf3", "d5", "Bb3", "Bd6"] },

    // --- Sicilian Defense (1. e4 c5) ---
    { name: "Sicilian Defense: Najdorf (English Attack)", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5", "Nb3", "Be6", "f3", "Be7", "Qd2"] },
    { name: "Sicilian Defense: Najdorf (6.Bg5)", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Bg5", "e6", "f4", "Be7", "Qf3", "Qc7"] },
    { name: "Sicilian Defense: Dragon (Yugoslav Attack)", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3", "O-O", "Qd2", "Nc6", "Bc4", "Bd7", "O-O-O"] },
    { name: "Sicilian Defense: Classical", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "Nc6", "Bg5", "e6", "Qd2", "a6", "O-O-O"] },
    { name: "Sicilian Defense: Scheveningen", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6", "Be2", "a6", "O-O", "Be7", "f4", "O-O"] },
    { name: "Sicilian Defense: Sveshnikov", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5", "Ndb5", "d6", "Bg5", "a6", "Na3", "b5"] },
    { name: "Sicilian Defense: Alapin Variation", moves: ["e4", "c5", "c3", "d5", "exd5", "Qxd5", "d4", "Nf6", "Nf3", "e6", "Be2", "Be7", "O-O", "O-O"] },
    { name: "Sicilian Defense: Closed", moves: ["e4", "c5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "d3", "d6", "f4", "e6", "Nf3", "Nge7"] },
    { name: "Sicilian Defense: Kan Variation", moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6", "Bd3", "Nf6", "O-O", "d6"] },
    { name: "Sicilian Defense: Taimanov Variation", moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7", "Be2", "a6"] },

    // --- French & Caro-Kann ---
    { name: "French Defense: Winawer", moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7", "Qg4"] },
    { name: "French Defense: Classical", moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7", "Bxe7", "Qxe7", "f4", "O-O"] },
    { name: "French Defense: Tarrasch", moves: ["e4", "e6", "d4", "d5", "Nd2", "Nf6", "e5", "Nfd7", "Bd3", "c5", "c3", "Nc6", "Ne2"] },
    { name: "French Defense: Advance", moves: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "a3", "c4"] },
    { name: "Caro-Kann Defense: Classical", moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6", "Nf3", "Nd7"] },
    { name: "Caro-Kann Defense: Advance", moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5", "Be3", "Qb6"] },
    { name: "Caro-Kann Defense: Exchange", moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "Bd3", "Nc6", "c3", "Nf6", "Bf4", "Bg4", "Qb3"] },
    { name: "Scandinavian Defense: Main Line", moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "c6", "Bc4", "Bf5"] },
    { name: "Alekhine's Defense", moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "Nf3", "g6", "Bc4", "Nb6", "Bb3", "Bg7"] },
    { name: "Pirc Defense: Austrian Attack", moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "f4", "Bg7", "Nf3", "O-O", "Bd3", "Na6"] },
    { name: "Modern Defense", moves: ["e4", "g6", "d4", "Bg7", "Nc3", "d6", "f4", "a6", "Nf3", "b5"] },

    // --- Queen's Gambit & Closed Games (1. d4) ---
    { name: "Queen's Gambit Declined: Orthodox", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "Rc1", "c6"] },
    { name: "Queen's Gambit Declined: Tartakower", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6", "cxd5", "Nxd5"] },
    { name: "Queen's Gambit Declined: Exchange", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "c6", "e3", "Be7", "Bd3", "Nbd7"] },
    { name: "Queen's Gambit Accepted", moves: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "e6", "Bxc4", "c5", "O-O", "a6", "Qe2", "b5", "Bb3"] },
    { name: "Slav Defense: Main Line", moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3", "e6", "Bxc4", "Bb4"] },
    { name: "Semi-Slav Defense: Meran", moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6", "e3", "Nbd7", "Bd3", "dxc4", "Bxc4", "b5", "Bd3", "a6"] },
    { name: "London System", moves: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "Nc6", "Nd2", "e6", "Ngf3", "Bd6", "Bg3", "O-O"] },
    { name: "King's Indian Defense: Classical", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7"] },
    { name: "King's Indian Defense: Sämisch", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "e5", "d5", "c6"] },
    { name: "Grünfeld Defense: Exchange", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3", "bxc3", "Bg7", "Nf3", "c5", "Rb1"] },
    { name: "Nimzo-Indian: Classical (4.Qc2)", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2", "O-O", "a3", "Bxc3+", "Qxc3", "b6"] },
    { name: "Nimzo-Indian: Rubinstein (4.e3)", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5", "Nf3", "c5", "O-O"] },
    { name: "Queen's Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "g3", "Ba6", "b3", "Bb4+", "Bd2", "Be7"] },
    { name: "Catalan Opening", moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7", "Nf3", "O-O", "O-O", "dxc4", "Qc2"] },
    { name: "Modern Benoni", moves: ["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3", "exd5", "cxd5", "d6", "e4", "g6", "Nf3", "Bg7"] },
    { name: "Benko Gambit", moves: ["d4", "Nf6", "c4", "c5", "d5", "b5", "cxb5", "a6", "bxa6", "g6", "Nc3", "Bxa6"] },
    { name: "Dutch Defense: Leningrad", moves: ["d4", "f5", "g3", "Nf6", "Bg2", "g6", "Nf3", "Bg7", "O-O", "O-O", "c4", "d6"] },

    // --- Flank Openings (1. c4, 1. Nf3) ---
    { name: "English Opening: Symmetrical", moves: ["c4", "c5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "Nf3", "Nf6", "O-O", "O-O"] },
    { name: "English Opening: Reversed Sicilian", moves: ["c4", "e5", "Nc3", "Nf6", "Nf3", "Nc6", "g3", "Bb4", "Bg2", "O-O", "O-O"] },
    { name: "Réti Opening", moves: ["Nf3", "d5", "c4", "e6", "g3", "Nf6", "Bg2", "Be7", "O-O", "O-O", "b3", "c5"] }
];

const bookDatabase = {};

function initBookDatabase() {
    masterOpenings.forEach(function(opening) {
        var tempGame = new Chess();
        for (var i = 0; i < opening.moves.length; i++) {
            var moveSan = opening.moves[i];
            var key = tempGame.fen().split(' ').slice(0, 4).join(' ');

            if (!bookDatabase[key]) {
                bookDatabase[key] = {
                    name: opening.name,
                    moves: []
                };
            } else if (i >= 2) {
                bookDatabase[key].name = opening.name;
            }

            var res = tempGame.move(moveSan);
            if (!res) break;

            var existing = bookDatabase[key].moves.find(function(m) { return m.san === res.san; });
            if (existing) {
                existing.weight += 1;
            } else {
                bookDatabase[key].moves.push({
                    san: res.san,
                    from: res.from,
                    to: res.to,
                    weight: 1,
                    name: opening.name
                });
            }
        }
    });
}

function getBookEntry(game) {
    var key = game.fen().split(' ').slice(0, 4).join(' ');
    return bookDatabase[key] || null;
}

function getBookMove(game) {
    var entry = getBookEntry(game);
    if (!entry || !entry.moves || entry.moves.length === 0) return null;

    var totalWeight = entry.moves.reduce(function(sum, m) { return sum + m.weight; }, 0);
    var rand = Math.random() * totalWeight;
    var running = 0;
    for (var i = 0; i < entry.moves.length; i++) {
        running += entry.moves[i].weight;
        if (rand <= running) {
            return entry.moves[i];
        }
    }
    return entry.moves[0];
}

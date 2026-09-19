var board = null;
var game = new Chess();
var mode = null;               // null | 'bot' | 'multi'
var myColor = 'w';
var lastKnownOpening = "Starting Position";
var botColorChoice = 'w';
var selectedSquare = null;     // tap-to-move: currently selected square, or null

initBookDatabase();

// -------------------------------------------------------------
// Screen / view navigation
// -------------------------------------------------------------
var viewTitles = { home: 'Play Chess', bots: 'Play Bots', friend: 'Play a Friend', settings: 'Settings' };

function showView(name) {
    Object.keys(viewTitles).forEach(function(v) {
        document.getElementById('view-' + v).classList.toggle('active', v === name);
    });
    document.getElementById('setup-panel-title').innerText = viewTitles[name];
    document.getElementById('setup-back-btn').classList.toggle('visible', name !== 'home');
}

function goToSetupScreen() {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('setup-screen').classList.add('active');
}

function goToGameScreen() {
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    sizeBoard();
    if (!board) {
        createBoard();
    } else {
        board.resize();
    }
    highlightLastMove();
}

function returnToMenu() {
    if (mode === 'bot') {
        bot.postMessage('stop');
    }
    if (conn) { conn.close(); conn = null; }
    mode = null;
    selectedSquare = null;
    clearTapHighlights();
    goToSetupScreen();
    showView('home');
}

// -------------------------------------------------------------
// UI helpers (layout sizing, player bars)
// -------------------------------------------------------------
function sizeBoard() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var mobile = vw <= 900;
    var sideW = vw > 1100 ? 206 : 0;
    var panelW = mobile ? 0 : Math.round(Math.min(460, Math.max(360, vw * 0.28)));
    var maxByW, maxByH;

    if (mobile) {
        maxByW = vw - 24 - 32;
        maxByH = 10000;
    } else {
        // page padding (32) + gap between board and panel (32)
        maxByW = vw - sideW - panelW - 64;
        // page padding (32) + two player bars (~96) + gaps (16)
        maxByH = vh - 150;
    }

    var size = Math.min(maxByW, maxByH, 880);
    size = Math.max(240, Math.floor(size / 8) * 8);

    var root = document.documentElement;
    root.style.setProperty('--board', size + 'px');
    root.style.setProperty('--panel-w', panelW + 'px');
}

function pickColor(c) {
    botColorChoice = c;
    var btns = document.querySelectorAll('#color-seg button');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].getAttribute('data-color') === c);
    }
}

function playBot() {
    var c = botColorChoice === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : botColorChoice;
    startBotMatch(c);
    goToGameScreen();
}

function getMyName() {
    var v = (document.getElementById('my-name').value || '').trim();
    return (v || 'Guest').slice(0, 24);
}

// which: 'top' | 'bottom'. Uses textContent so peer-supplied names can't inject HTML.
function setPlayer(which, name, iconClass, note) {
    var el = document.getElementById(which + '-player');
    el.querySelector('.pname').textContent = name;
    el.querySelector('.pnote').textContent = note ? '(' + note + ')' : '';
    el.querySelector('.avatar i').className = iconClass;
}

function highlightLastMove() {
    $('#myBoard .square-55d63').removeClass('hl-last');
    var h = game.history({ verbose: true });
    if (!h.length) return;
    var m = h[h.length - 1];
    $('#myBoard [data-square="' + m.from + '"]').addClass('hl-last');
    $('#myBoard [data-square="' + m.to + '"]').addClass('hl-last');
}

// -------------------------------------------------------------
// Opening theory panel
// -------------------------------------------------------------
function updateOpeningInfo() {
    var entry = getBookEntry(game);
    var nameEl = document.getElementById('opening-name');
    var movesListEl = document.getElementById('book-moves-list');

    if (entry && entry.moves && entry.moves.length > 0) {
        lastKnownOpening = entry.name;
        nameEl.innerText = entry.name;
        movesListEl.innerHTML = '';
        entry.moves.forEach(function(m) {
            var chip = document.createElement('button');
            chip.className = 'book-chip';
            chip.innerHTML = '<i class="ph-bold ph-arrow-right"></i> ' + m.san;
            chip.title = 'Play ' + m.san + ' (' + m.name + ')';
            chip.onclick = function() {
                if (!game.game_over() && mode && game.turn() === myColor) {
                    makeMoveBySan(m.san);
                }
            };
            movesListEl.appendChild(chip);
        });
    } else {
        if (game.history().length > 0) {
            nameEl.innerText = (lastKnownOpening || "Midgame") + " (Out of Book)";
            movesListEl.innerHTML = '<span class="out-of-book">Out of book theory / Novelty</span>';
        } else {
            nameEl.innerText = "Starting Position";
            movesListEl.innerHTML = '';
        }
    }

    highlightLastMove();
}

// Central "a move just happened" handler - clears selection, redraws, syncs everything.
function afterMove(move, sourceOfTruth) {
    selectedSquare = null;
    clearTapHighlights();
    board.position(game.fen());
    updateStatus();
    updateOpeningInfo();

    if (sourceOfTruth === 'local') {
        if (mode === 'multi' && conn) {
            conn.send({ type: 'move', move: move.san });
        } else if (mode === 'bot') {
            handleBotTurn();
        }
    }
}

function makeMoveBySan(san) {
    var move = game.move(san);
    if (!move) return;
    afterMove(move, 'local');
}

// -------------------------------------------------------------
// Tap-to-move
// -------------------------------------------------------------
function clearTapHighlights() {
    $('#myBoard .square-55d63').removeClass('hl-select hl-move hl-capture');
}

function selectSquare(square) {
    clearTapHighlights();
    selectedSquare = square;
    $('#myBoard [data-square="' + square + '"]').addClass('hl-select');
    var moves = game.moves({ square: square, verbose: true });
    moves.forEach(function(m) {
        $('#myBoard [data-square="' + m.to + '"]').addClass(m.captured ? 'hl-capture' : 'hl-move');
    });
}

function canInteract() {
    if (!mode) return false;
    if (game.game_over()) return false;
    if (mode === 'bot' && game.turn() !== myColor) return false;
    if (mode === 'multi' && game.turn() !== myColor) return false;
    return true;
}

function onSquareTap(square) {
    if (!canInteract()) return;

    var piece = game.get(square);
    var turnColor = game.turn();

    if (selectedSquare) {
        if (square === selectedSquare) {
            selectedSquare = null;
            clearTapHighlights();
            highlightLastMove();
            return;
        }

        var legal = game.moves({ square: selectedSquare, verbose: true }).some(function(m) { return m.to === square; });
        if (legal) {
            var move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
            if (move) {
                afterMove(move, 'local');
                return;
            }
        }

        if (piece && piece.color === turnColor) {
            selectSquare(square);
            return;
        }

        selectedSquare = null;
        clearTapHighlights();
        highlightLastMove();
        return;
    }

    if (piece && piece.color === turnColor) {
        selectSquare(square);
    }
}

function bindTapToMove() {
    $('#myBoard').on('click', '.square-55d63', function() {
        var sq = this.getAttribute('data-square');
        if (sq) onSquareTap(sq);
    });
}

// -------------------------------------------------------------
// Peer-to-peer networking (Play a Friend)
// -------------------------------------------------------------
var peer = new Peer();
var conn = null;

peer.on('open', function(id) {
    document.getElementById('my-id').innerText = id;
});

peer.on('connection', function(connection) {
    conn = connection;
    mode = 'multi';
    myColor = 'b';
    selectedSquare = null;
    game.reset();
    lastKnownOpening = "Starting Position";

    goToGameScreen();
    board.orientation('black');
    board.position('start');

    setupConnectionLogic();

    conn.on('open', function() {
        var myName = getMyName();
        conn.send({ type: 'name', name: myName });
        setPlayer('bottom', myName, 'ph-fill ph-user', 'Black');
    });

    updateStatus('Multiplayer: Friend Joined!');
    updateOpeningInfo();
});

function connectToPeer() {
    var friendId = document.getElementById('friend-id').value;
    if (!friendId) return alert('Enter a valid ID');

    conn = peer.connect(friendId);
    conn.on('open', function() {
        mode = 'multi';
        myColor = 'w';
        selectedSquare = null;
        game.reset();
        lastKnownOpening = "Starting Position";

        goToGameScreen();
        board.orientation('white');
        board.position('start');

        setupConnectionLogic();

        var myName = getMyName();
        conn.send({ type: 'name', name: myName });
        setPlayer('bottom', myName, 'ph-fill ph-user', 'White');

        updateStatus('Multiplayer: Connected!');
        updateOpeningInfo();
    });
}

function setupConnectionLogic() {
    conn.on('data', function(data) {
        if (data.type === 'move') {
            var move = game.move(data.move);
            if (move) afterMove(move, 'remote');
        } else if (data.type === 'name') {
            setPlayer('top', String(data.name || 'Opponent').slice(0, 24), 'ph-fill ph-user', '');
        }
    });
}

// -------------------------------------------------------------
// Stockfish AI Web Worker (Grandmaster engine option)
// -------------------------------------------------------------
const sfCode = "importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js');";
const sfBlob = new Blob([sfCode], { type: 'application/javascript' });
const bot = new Worker(URL.createObjectURL(sfBlob));

var botStartTime = 0;
var botCurrentDepth = 0;
var botEvaluation = null;

bot.onmessage = function(event) {
    var line = event.data;

    if (line.startsWith('info') && line.includes('score')) {
        var depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) botCurrentDepth = parseInt(depthMatch[1], 10);

        var cpMatch = line.match(/score cp (-?\d+)/);
        if (cpMatch) {
            var cp = parseInt(cpMatch[1], 10) / 100;
            botEvaluation = (cp >= 0 ? '+' : '') + cp.toFixed(2);
        } else if (line.includes('score mate')) {
            var mateMatch = line.match(/score mate (-?\d+)/);
            if (mateMatch) {
                var mateVal = parseInt(mateMatch[1], 10);
                botEvaluation = 'Mate in ' + Math.abs(mateVal);
            }
        }

        if (mode === 'bot' && game.turn() !== myColor) {
            var evalText = botEvaluation ? ' | Eval: ' + botEvaluation : '';
            updateStatus('🤖 Light Yagami calculating... (Depth ' + botCurrentDepth + evalText + ')');
        }
    }

    if (line.startsWith('bestmove')) {
        var moveStr = line.split(' ')[1];
        if (moveStr && moveStr !== '(none)') {
            var targetPace = parseInt(document.getElementById('bot-pace').value || '1600', 10);
            var elapsed = Date.now() - botStartTime;
            var remainingDelay = Math.max(0, targetPace - elapsed);

            setTimeout(function() {
                if (mode !== 'bot' || game.turn() === myColor) return;
                var played = game.move(moveStr, { sloppy: true });
                if (played) {
                    var evalSnippet = botEvaluation ? ' [' + botEvaluation + ']' : '';
                    afterMove(played, 'remote');
                    updateStatus('🤖 Light Yagami played ' + played.san + evalSnippet);
                }
            }, remainingDelay);
        }
    }
};

function handleBotTurn() {
    if (game.game_over()) return;
    if (mode !== 'bot' || game.turn() === myColor) return;

    botStartTime = Date.now();
    var targetPace = parseInt(document.getElementById('bot-pace').value || '1600', 10);
    var engineType = document.getElementById('bot-engine') ? document.getElementById('bot-engine').value : 'custom';

    // 1. Check if an opening book move is available
    var bookMove = getBookMove(game);
    if (bookMove) {
        updateStatus('🤖 Light Yagami is pondering book theory...');
        var bookDelay = Math.round(targetPace * (0.85 + Math.random() * 0.3));
        setTimeout(function() {
            if (mode !== 'bot' || game.turn() === myColor) return;
            var played = game.move(bookMove.san);
            if (played) {
                afterMove(played, 'remote');
                updateStatus('🤖 Light Yagami played 📖 ' + played.san + ' (' + bookMove.name + ')');
            }
        }, bookDelay);
        return;
    }

    // 2. Custom Bot Engine (ported from main.cpp)
    if (engineType === 'custom') {
        var depth = parseInt(document.getElementById('bot-depth').value || '4', 10);
        updateStatus('🤖 Light Yagami (Custom Engine) calculating depth ' + depth + '...');

        setTimeout(function() {
            if (mode !== 'bot' || game.turn() === myColor) return;
            var result = findCustomBotMove(game, depth);
            if (result && result.move) {
                var elapsed = Date.now() - botStartTime;
                var remainingDelay = Math.max(0, targetPace - elapsed);

                setTimeout(function() {
                    if (mode !== 'bot' || game.turn() === myColor) return;
                    var played = game.move(result.move);
                    if (played) {
                        var evalStr = (result.score / 100).toFixed(2);
                        evalStr = (result.score >= 0 ? '+' : '') + evalStr;
                        afterMove(played, 'remote');
                        updateStatus('🤖 Light Yagami played ' + played.san + ' [' + evalStr + ', ' + result.nodes.toLocaleString() + ' nodes]');
                    }
                }, remainingDelay);
            }
        }, 60);
        return;
    }

    // 3. Stockfish engine calculation
    var sfDepth = parseInt(document.getElementById('bot-depth').value || '15', 10);
    botEvaluation = null;
    updateStatus('🤖 Light Yagami (Stockfish) calculating deeply...');
    bot.postMessage('position fen ' + game.fen());
    bot.postMessage('go depth ' + sfDepth);
}

function onEngineChange() {
    var engine = document.getElementById('bot-engine').value;
    var depthSelect = document.getElementById('bot-depth');
    if (engine === 'custom') {
        depthSelect.innerHTML =
            '<option value="3">Casual (Depth 3)</option>' +
            '<option value="4" selected>Tactical (Depth 4)</option>' +
            '<option value="5">Master (Depth 5)</option>';
    } else {
        depthSelect.innerHTML =
            '<option value="10">Intermediate (Depth 10)</option>' +
            '<option value="13">Advanced (Depth 13)</option>' +
            '<option value="15" selected>Grandmaster (Depth 15)</option>' +
            '<option value="18">Mastermind (Depth 18)</option>';
    }
}

function startBotMatch(chosenColor) {
    if (conn) { conn.close(); conn = null; }
    bot.postMessage('stop');
    mode = 'bot';
    myColor = chosenColor || 'w';
    selectedSquare = null;
    game.reset();
    lastKnownOpening = "Starting Position";

    bot.postMessage('uci');
    bot.postMessage('setoption name Skill Level value 20');
    bot.postMessage('setoption name Hash value 32');
    bot.postMessage('isready');

    var myName = getMyName();
    if (myColor === 'w') {
        setPlayer('bottom', myName, 'ph-fill ph-user', 'White');
        setPlayer('top', 'Light Yagami', 'ph-fill ph-robot', 'Black');
        updateStatus('Match started! Your move.');
    } else {
        setPlayer('bottom', myName, 'ph-fill ph-user', 'Black');
        setPlayer('top', 'Light Yagami', 'ph-fill ph-robot', 'White');
        updateStatus('Match started! Bot is opening...');
    }
}

// -------------------------------------------------------------
// Chess status / validation
// -------------------------------------------------------------
function updateStatus(overrideText) {
    var box = document.getElementById('status');
    var statusEl = box.querySelector('span');
    var statusIcon = box.querySelector('i');

    var moveColor = game.turn() === 'w' ? 'White' : 'Black';
    var state = '';
    var icon = 'ph ph-info';
    var text = moveColor + ' to move';

    if (game.in_checkmate()) {
        state = 'over';
        icon = 'ph-fill ph-warning-circle';
        text = 'Checkmate! ' + moveColor + ' has no legal moves.';
    } else if (game.in_draw()) {
        state = 'draw';
        icon = 'ph-fill ph-handshake';
        text = 'Game Over: Drawn position.';
    } else {
        if (game.in_check()) {
            state = 'check';
            icon = 'ph-fill ph-warning';
            text += ' (Check!)';
        }
        if (overrideText) {
            text = overrideText;
            icon = 'ph ph-info';
        }
    }

    statusEl.innerText = text;
    statusIcon.className = icon;
    box.className = 'status-box' + (state ? ' ' + state : '');
}

// -------------------------------------------------------------
// Drag-to-move (chessboard.js), works alongside tap-to-move
// -------------------------------------------------------------
function onDragStart(source, piece) {
    if (!canInteract()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    afterMove(move, 'local');
}

function onSnapEnd() {
    board.position(game.fen());
}

function createBoard() {
    var config = {
        draggable: true,
        position: game.fen() === (new Chess()).fen() ? 'start' : game.fen(),
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    board = Chessboard('myBoard', config);
    bindTapToMove();
}

// -------------------------------------------------------------
// Misc UI utilities
// -------------------------------------------------------------
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function(err) {
            alert('Error attempting to enable full-screen: ' + err.message);
        });
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function copyId() {
    var idText = document.getElementById('my-id').innerText;
    if (idText && idText !== 'Generating...') {
        navigator.clipboard.writeText(idText).then(function() {
            var originalText = idText;
            document.getElementById('my-id').innerText = 'Copied!';
            setTimeout(function() {
                document.getElementById('my-id').innerText = originalText;
            }, 1500);
        });
    }
}

// -------------------------------------------------------------
// Init
// -------------------------------------------------------------
sizeBoard();
goToSetupScreen();
showView('home');

document.getElementById('side-name').innerText = getMyName();
document.getElementById('my-name').addEventListener('input', function() {
    document.getElementById('side-name').innerText = getMyName();
    if (mode === null) setPlayer('bottom', getMyName(), 'ph-fill ph-user', '');
});

window.addEventListener('resize', function() {
    sizeBoard();
    if (board) {
        board.resize();
        highlightLastMove();
    }
});

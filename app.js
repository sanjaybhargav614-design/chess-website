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
    hideGameOver();
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
        maxByW = vw - 24 - 32 - 36;
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
    var btns = document.querySelectorAll('#color-seg .color-btn, #color-seg button');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].getAttribute('data-color') === c);
    }
}

function renderBotCategories() {
    var container = document.getElementById('bot-category-tabs');
    if (!container || typeof BOT_CATEGORIES === 'undefined') return;

    container.innerHTML = '';
    BOT_CATEGORIES.forEach(function(cat) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat-tab' + (currentBotFilter === cat.id ? ' active' : '');
        btn.innerHTML = '<i class="' + cat.icon + '"></i> ' + cat.name;
        btn.onclick = function() {
            currentBotFilter = cat.id;
            var tabs = document.querySelectorAll('.cat-tab');
            for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
            btn.classList.add('active');
            renderBotsGrid();
        };
        container.appendChild(btn);
    });
}

function renderBotsGrid() {
    var container = document.getElementById('bots-grid');
    if (!container || typeof BOTS === 'undefined') return;

    var list = getBotsByCategory(currentBotFilter);
    container.innerHTML = '';
    list.forEach(function(b) {
        var card = document.createElement('div');
        card.className = 'bot-card' + (selectedBot && selectedBot.id === b.id ? ' active' : '');
        card.id = 'bot-card-' + b.id;
        card.onclick = function() { selectBot(b.id); };

        card.innerHTML =
            '<div class="bot-card-avatar">' + b.avatar + '</div>' +
            '<div class="bot-card-name" title="' + b.name + '">' + b.name + '</div>' +
            '<div class="bot-card-elo">' + b.elo + '</div>' +
            '<span class="bot-card-badge">' + (b.badge || b.title) + '</span>';

        container.appendChild(card);
    });
}

function selectBot(botId) {
    var b = getBotById(botId);
    if (!b) return;
    selectedBot = b;

    var heroAvatar = document.getElementById('bot-hero-avatar');
    var heroName = document.getElementById('bot-hero-name');
    var heroElo = document.getElementById('bot-hero-elo');
    var heroQuote = document.getElementById('bot-hero-quote');

    if (heroAvatar) heroAvatar.innerHTML = b.avatar;
    if (heroName) {
        heroName.innerHTML = b.name + ' <span class="hero-badge">' + (b.badge || b.title) + '</span>';
    }
    if (heroElo) heroElo.textContent = b.elo;
    if (heroQuote) heroQuote.textContent = b.quote;

    var cards = document.querySelectorAll('.bot-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('active');
    }
    var activeCard = document.getElementById('bot-card-' + b.id);
    if (activeCard) activeCard.classList.add('active');
}

function toggleBotOptions() {
    var panel = document.getElementById('bot-options-panel');
    var btn = document.getElementById('options-toggle-btn');
    if (!panel) return;
    panel.classList.toggle('open');
    if (btn) btn.classList.toggle('open');
}

function playBot() {
    var c = botColorChoice === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : botColorChoice;
    goToGameScreen();
    startBotMatch(c);
}

function getMyName() {
    var v = (document.getElementById('my-name').value || '').trim();
    return (v || 'Guest').slice(0, 24);
}

// which: 'top' | 'bottom'. Supports SVG avatar markup or CSS icon class
function setPlayer(which, name, avatarHtmlOrClass, note) {
    var el = document.getElementById(which + '-player');
    if (!el) return;
    el.querySelector('.pname').textContent = name;
    el.querySelector('.pnote').textContent = note ? '(' + note + ')' : '';
    var avEl = el.querySelector('.avatar');
    if (avatarHtmlOrClass && (avatarHtmlOrClass.indexOf('<svg') !== -1 || avatarHtmlOrClass.indexOf('data:') !== -1)) {
        avEl.innerHTML = avatarHtmlOrClass;
    } else {
        avEl.innerHTML = '<i class="' + (avatarHtmlOrClass || 'ph-fill ph-user') + '"></i>';
    }
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
}

// -------------------------------------------------------------
// Audio Synthesizer (Web Audio API - zero external assets needed)
// -------------------------------------------------------------
var audioCtx = null;
var soundEnabled = true;

function getAudioContext() {
    if (!audioCtx) {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    var btn = document.getElementById('sound-btn');
    var txt = document.getElementById('sound-btn-text');
    if (btn) {
        btn.querySelector('i').className = soundEnabled ? 'ph-bold ph-speaker-high' : 'ph-bold ph-speaker-slash';
        btn.classList.toggle('active', soundEnabled);
    }
    if (txt) txt.textContent = soundEnabled ? 'Sound' : 'Muted';
}

function playTone(freq, type, duration, gainVal, decay) {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(gainVal || 0.15, ctx.currentTime);
        if (decay) {
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playMoveSound() {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
}

function playCaptureSound() {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.11);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
}

function playCheckSound() {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        playTone(520, 'sine', 0.12, 0.25, true);
        setTimeout(function() {
            playTone(780, 'sine', 0.22, 0.3, true);
        }, 80);
    } catch (e) {}
}

function playCastleSound() {
    playMoveSound();
    setTimeout(playMoveSound, 80);
}

function playGameOverSound(isWin) {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        if (isWin) {
            playTone(523.25, 'triangle', 0.2, 0.2, true);
            setTimeout(function() { playTone(659.25, 'triangle', 0.25, 0.22, true); }, 100);
            setTimeout(function() { playTone(783.99, 'triangle', 0.45, 0.25, true); }, 200);
        } else {
            playTone(440, 'sine', 0.25, 0.25, true);
            setTimeout(function() { playTone(370, 'sine', 0.4, 0.25, true); }, 150);
        }
    } catch (e) {}
}

// -------------------------------------------------------------
// Captured Pieces & Material Differential
// -------------------------------------------------------------
var PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
var PIECE_GLYPHS = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' }
};

function updateCapturedPieces() {
    var boardState = game.board();
    var currentPieces = { w: { p:0, n:0, b:0, r:0, q:0 }, b: { p:0, n:0, b:0, r:0, q:0 } };

    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var piece = boardState[r][c];
            if (piece && piece.type !== 'k') {
                currentPieces[piece.color][piece.type]++;
            }
        }
    }

    var startingCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    var capturedByWhite = [];
    var capturedByBlack = [];
    var whiteScore = 0, blackScore = 0;

    ['q', 'r', 'b', 'n', 'p'].forEach(function(pt) {
        var bCaptured = startingCounts[pt] - currentPieces.b[pt];
        for (var i = 0; i < bCaptured; i++) {
            capturedByWhite.push(PIECE_GLYPHS.b[pt]);
            whiteScore += PIECE_VALUES[pt];
        }
        var wCaptured = startingCounts[pt] - currentPieces.w[pt];
        for (var j = 0; j < wCaptured; j++) {
            capturedByBlack.push(PIECE_GLYPHS.w[pt]);
            blackScore += PIECE_VALUES[pt];
        }
    });

    var diff = whiteScore - blackScore;
    var topIsWhite = (myColor === 'b');
    var topCapturedEl = document.querySelector('#top-captured .captured-pieces');
    var topAdvEl = document.querySelector('#top-captured .material-advantage');
    var bottomCapturedEl = document.querySelector('#bottom-captured .captured-pieces');
    var bottomAdvEl = document.querySelector('#bottom-captured .material-advantage');

    if (topIsWhite) {
        if (topCapturedEl) topCapturedEl.textContent = capturedByWhite.join('');
        if (bottomCapturedEl) bottomCapturedEl.textContent = capturedByBlack.join('');
        if (topAdvEl) {
            topAdvEl.textContent = diff > 0 ? '+' + diff : '';
            topAdvEl.classList.toggle('visible', diff > 0);
        }
        if (bottomAdvEl) {
            bottomAdvEl.textContent = diff < 0 ? '+' + Math.abs(diff) : '';
            bottomAdvEl.classList.toggle('visible', diff < 0);
        }
    } else {
        if (topCapturedEl) topCapturedEl.textContent = capturedByBlack.join('');
        if (bottomCapturedEl) bottomCapturedEl.textContent = capturedByWhite.join('');
        if (topAdvEl) {
            topAdvEl.textContent = diff < 0 ? '+' + Math.abs(diff) : '';
            topAdvEl.classList.toggle('visible', diff < 0);
        }
        if (bottomAdvEl) {
            bottomAdvEl.textContent = diff > 0 ? '+' + diff : '';
            bottomAdvEl.classList.toggle('visible', diff > 0);
        }
    }
}

// -------------------------------------------------------------
// Evaluation Bar
// -------------------------------------------------------------
function updateEvalBar(evalNum, mateIn) {
    var fillEl = document.getElementById('eval-bar-fill');
    var textEl = document.getElementById('eval-text');
    if (!fillEl || !textEl) return;

    if (typeof mateIn === 'number') {
        var pct = mateIn > 0 ? 100 : 0;
        fillEl.style.height = pct + '%';
        textEl.textContent = 'M' + Math.abs(mateIn);
        textEl.className = 'eval-text' + (mateIn < 0 ? ' black-lead' : '');
        return;
    }

    var score = typeof evalNum === 'number' ? evalNum : 0;
    var pct = 50 + 50 * (2 / (1 + Math.exp(-0.28 * score)) - 1);
    pct = Math.max(4, Math.min(96, pct));

    fillEl.style.height = pct.toFixed(1) + '%';
    var displayScore = (score >= 0 ? '+' : '') + score.toFixed(1);
    textEl.textContent = Math.abs(score) < 0.05 ? '0.0' : displayScore;
    textEl.className = 'eval-text' + (score < 0 ? ' black-lead' : '');
}

function updateMaterialEvalBar() {
    var boardState = game.board();
    var wScore = 0, bScore = 0;
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var piece = boardState[r][c];
            if (piece) {
                var val = PIECE_VALUES[piece.type] || 0;
                if (piece.color === 'w') wScore += val;
                else bScore += val;
            }
        }
    }
    var diff = wScore - bScore;
    updateEvalBar(diff);
}

// -------------------------------------------------------------
// Move Notation Table & Previewing
// -------------------------------------------------------------
function updateMoveHistoryTable() {
    var tbody = document.querySelector('#moves-table tbody');
    var badge = document.getElementById('move-count-badge');
    var wrap = document.getElementById('moves-table-wrap');
    if (!tbody) return;

    var history = game.history({ verbose: true });
    if (badge) badge.textContent = history.length + (history.length === 1 ? ' move' : ' moves');

    tbody.innerHTML = '';
    for (var i = 0; i < history.length; i += 2) {
        var moveNum = Math.floor(i / 2) + 1;
        var whiteMove = history[i];
        var blackMove = history[i + 1] || null;

        var tr = document.createElement('tr');

        var numTd = document.createElement('td');
        numTd.className = 'move-num';
        numTd.textContent = moveNum + '.';
        tr.appendChild(numTd);

        var wTd = document.createElement('td');
        wTd.className = 'move-cell' + (i === history.length - 1 ? ' active' : '');
        wTd.textContent = whiteMove.san;
        (function(idx) {
            wTd.onclick = function() { previewMoveAt(idx); };
        })(i);
        tr.appendChild(wTd);

        var bTd = document.createElement('td');
        bTd.className = 'move-cell' + (i + 1 === history.length - 1 ? ' active' : '');
        bTd.textContent = blackMove ? blackMove.san : '';
        if (blackMove) {
            (function(idx) {
                bTd.onclick = function() { previewMoveAt(idx); };
            })(i + 1);
        }
        tr.appendChild(bTd);

        tbody.appendChild(tr);
    }

    if (wrap) {
        wrap.scrollTop = wrap.scrollHeight;
    }
}

function previewMoveAt(historyIndex) {
    var history = game.history({ verbose: true });
    if (historyIndex < 0 || historyIndex >= history.length) return;

    var tempGame = new Chess();
    for (var i = 0; i <= historyIndex; i++) {
        tempGame.move(history[i]);
    }
    board.position(tempGame.fen(), false);

    var cells = document.querySelectorAll('.move-cell');
    for (var j = 0; j < cells.length; j++) cells[j].classList.remove('active');
    if (cells[historyIndex]) cells[historyIndex].classList.add('active');

    $('#myBoard .square-55d63').removeClass('hl-last hl-select hl-move hl-capture hl-check');
    var m = history[historyIndex];
    $('#myBoard [data-square="' + m.from + '"]').addClass('hl-last');
    $('#myBoard [data-square="' + m.to + '"]').addClass('hl-last');
}

// -------------------------------------------------------------
// King in Check Highlight
// -------------------------------------------------------------
function highlightKingIfInCheck() {
    $('#myBoard .square-55d63').removeClass('hl-check');
    if (!game.in_check()) return;

    var turn = game.turn();
    var boardState = game.board();
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var piece = boardState[r][c];
            if (piece && piece.type === 'k' && piece.color === turn) {
                var file = String.fromCharCode('a'.charCodeAt(0) + c);
                var rank = 8 - r;
                var sq = file + rank;
                $('#myBoard [data-square="' + sq + '"]').addClass('hl-check');
                return;
            }
        }
    }
}

// -------------------------------------------------------------
// Game Actions (Flip, Takeback, Resign, Rematch)
// -------------------------------------------------------------
function flipBoard() {
    if (!board) return;
    var current = board.orientation();
    board.orientation(current === 'white' ? 'black' : 'white');
    updateCapturedPieces();
}

function takebackMove() {
    if (!canInteract() || game.history().length === 0) return;
    if (mode === 'bot') {
        bot.postMessage('stop');
        game.undo();
        if (game.turn() !== myColor && game.history().length > 0) {
            game.undo();
        }
    } else {
        game.undo();
    }
    selectedSquare = null;
    clearTapHighlights();
    board.position(game.fen());
    updateStatus();
    updateOpeningInfo();
    updateCapturedPieces();
    updateMoveHistoryTable();
    updateMaterialEvalBar();
    highlightKingIfInCheck();
    hideGameOver();
    playMoveSound();
}

function resignGame() {
    if (!mode || game.game_over()) return;
    var botName = selectedBot ? selectedBot.name : 'Opponent';
    showGameOver('loss', 'Resigned', 'You resigned the game vs ' + botName + '.');
    playGameOverSound(false);
    updateStatus('Game Over: Resigned.');
}

function rematchGame() {
    hideGameOver();
    if (mode === 'bot') {
        playBot();
    } else {
        game.reset();
        board.position('start');
        updateStatus('New game started!');
        updateOpeningInfo();
        updateCapturedPieces();
        updateMoveHistoryTable();
        updateMaterialEvalBar();
        highlightKingIfInCheck();
    }
}

function showGameOver(result, title, subtitle) {
    var overlay = document.getElementById('game-over-overlay');
    var iconEl = document.getElementById('go-icon');
    var titleEl = document.getElementById('go-title');
    var subEl = document.getElementById('go-subtitle');
    var statsEl = document.getElementById('go-stats');

    if (!overlay) return;
    if (titleEl) titleEl.textContent = title || 'Game Over';
    if (subEl) subEl.textContent = subtitle || '';
    if (statsEl) {
        var totalMoves = game.history().length;
        var botName = selectedBot ? selectedBot.name : 'Opponent';
        statsEl.textContent = totalMoves + ' moves • Against ' + botName;
    }
    if (iconEl) {
        if (result === 'win') {
            iconEl.innerHTML = '<i class="ph-fill ph-crown" style="color: #f2b880;"></i>';
        } else if (result === 'draw') {
            iconEl.innerHTML = '<i class="ph-fill ph-handshake" style="color: #f7c631;"></i>';
        } else {
            iconEl.innerHTML = '<i class="ph-fill ph-flag" style="color: #fa412d;"></i>';
        }
    }
    overlay.classList.add('active');
}

function hideGameOver() {
    var overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.classList.remove('active');
}

// Central "a move just happened" handler - clears selection, redraws, syncs everything.
function afterMove(move, sourceOfTruth) {
    selectedSquare = null;
    clearTapHighlights();
    board.position(game.fen());
    updateStatus();
    updateOpeningInfo();
    updateCapturedPieces();
    updateMoveHistoryTable();
    highlightKingIfInCheck();

    if (game.in_checkmate()) {
        var won = (mode === 'bot' && game.turn() !== myColor);
        playGameOverSound(won);
        var winner = game.turn() === 'w' ? 'Black' : 'White';
        showGameOver(won ? 'win' : 'loss', won ? 'Victory!' : 'Defeat', 'Checkmate - ' + winner + ' wins!');
    } else if (game.in_draw()) {
        playGameOverSound(false);
        showGameOver('draw', 'Draw', 'Game drawn by stalemate / rules.');
    } else if (game.in_check()) {
        playCheckSound();
    } else if (move.captured) {
        playCaptureSound();
    } else if (move.san.indexOf('O-O') !== -1) {
        playCastleSound();
    } else {
        playMoveSound();
    }

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

    if (board && board.position && board.fen() !== game.fen()) {
        board.position(game.fen());
        highlightLastMove();
        highlightKingIfInCheck();
    }

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
// Custom Bot Engine Web Worker (runs main.cpp-ported search off-thread)
// -------------------------------------------------------------
var customBotWorker = new Worker('custom-bot-worker.js');

customBotWorker.onmessage = function(e) {
    if (mode !== 'bot' || game.turn() === myColor) return;
    var data = e.data;
    if (!data || !data.move) return;

    var paceVal = document.getElementById('bot-pace') ? document.getElementById('bot-pace').value : 'auto';
    var targetPace = paceVal === 'auto' ? (selectedBot && selectedBot.pace ? selectedBot.pace : 1600) : parseInt(paceVal, 10);
    var elapsed = Date.now() - botStartTime;
    var remainingDelay = Math.max(0, targetPace - elapsed);

    setTimeout(function() {
        if (mode !== 'bot' || game.turn() === myColor) return;
        var played = game.move({ from: data.move.from, to: data.move.to, promotion: data.move.promotion || 'q' });
        if (played) {
            var evalStr = (data.score / 100).toFixed(2);
            evalStr = (data.score >= 0 ? '+' : '') + evalStr;
            var botName = selectedBot ? selectedBot.name : 'Bot';
            updateEvalBar(data.score / 100);
            afterMove(played, 'remote');
            updateStatus('🤖 ' + botName + ' played ' + played.san + ' [' + evalStr + ', ' + data.nodes.toLocaleString() + ' nodes]');
        }
    }, remainingDelay);
};

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
    var botName = selectedBot ? selectedBot.name : 'Bot';

    if (line.startsWith('info') && line.includes('score')) {
        var depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) botCurrentDepth = parseInt(depthMatch[1], 10);

        var cpMatch = line.match(/score cp (-?\d+)/);
        if (cpMatch) {
            var cp = parseInt(cpMatch[1], 10) / 100;
            var whiteScore = game.turn() === 'w' ? cp : -cp;
            botEvaluation = (whiteScore >= 0 ? '+' : '') + whiteScore.toFixed(2);
            updateEvalBar(whiteScore);
        } else if (line.includes('score mate')) {
            var mateMatch = line.match(/score mate (-?\d+)/);
            if (mateMatch) {
                var mateVal = parseInt(mateMatch[1], 10);
                var whiteMate = game.turn() === 'w' ? mateVal : -mateVal;
                botEvaluation = 'Mate in ' + Math.abs(whiteMate);
                updateEvalBar(null, whiteMate);
            }
        }

        if (mode === 'bot' && game.turn() !== myColor) {
            var evalText = botEvaluation ? ' | Eval: ' + botEvaluation : '';
            updateStatus('🤖 ' + botName + ' calculating... (Depth ' + botCurrentDepth + evalText + ')');
        }
    }

    if (line.startsWith('bestmove')) {
        var moveStr = line.split(' ')[1];
        if (moveStr && moveStr !== '(none)') {
            var paceVal = document.getElementById('bot-pace') ? document.getElementById('bot-pace').value : 'auto';
            var targetPace = paceVal === 'auto' ? (selectedBot && selectedBot.pace ? selectedBot.pace : 1600) : parseInt(paceVal, 10);
            var elapsed = Date.now() - botStartTime;
            var remainingDelay = Math.max(0, targetPace - elapsed);

            setTimeout(function() {
                if (mode !== 'bot' || game.turn() === myColor) return;
                var played = game.move(moveStr, { sloppy: true });
                if (played) {
                    var evalSnippet = botEvaluation ? ' [' + botEvaluation + ']' : '';
                    afterMove(played, 'remote');
                    updateStatus('🤖 ' + botName + ' played ' + played.san + evalSnippet);
                }
            }, remainingDelay);
        }
    }
};

function handleBotTurn() {
    if (game.game_over()) return;
    if (mode !== 'bot' || game.turn() === myColor) return;

    botStartTime = Date.now();
    var paceVal = document.getElementById('bot-pace') ? document.getElementById('bot-pace').value : 'auto';
    var targetPace = paceVal === 'auto' ? (selectedBot && selectedBot.pace ? selectedBot.pace : 1600) : parseInt(paceVal, 10);
    var engineVal = document.getElementById('bot-engine') ? document.getElementById('bot-engine').value : 'auto';
    var engineType = engineVal === 'auto' ? (selectedBot && selectedBot.engine ? selectedBot.engine : 'stockfish') : engineVal;
    var botName = selectedBot ? selectedBot.name : 'Bot';

    // 1. Check if an opening book move is available
    var bookMove = getBookMove(game);
    if (bookMove) {
        updateStatus('🤖 ' + botName + ' is pondering book theory...');
        var bookDelay = Math.round(targetPace * (0.85 + Math.random() * 0.3));
        setTimeout(function() {
            if (mode !== 'bot' || game.turn() === myColor) return;
            var played = game.move(bookMove.san);
            if (played) {
                afterMove(played, 'remote');
                updateStatus('🤖 ' + botName + ' played 📖 ' + played.san + ' (' + bookMove.name + ')');
            }
        }, bookDelay);
        return;
    }

    // 2. Custom Bot Engine (ported from main.cpp) - runs in a Web Worker
    if (engineType === 'custom') {
        var depth = (selectedBot && selectedBot.depth) ? Math.min(5, selectedBot.depth) : 4;
        updateStatus('🤖 ' + botName + ' (Custom Engine) calculating depth ' + depth + '...');
        customBotWorker.postMessage({ fen: game.fen(), depth: depth });
        return;
    }

    // 3. Stockfish engine calculation
    var sfDepth = (selectedBot && selectedBot.depth) ? selectedBot.depth : 15;
    var sfSkill = (selectedBot && typeof selectedBot.skillLevel === 'number') ? selectedBot.skillLevel : 20;
    botEvaluation = null;
    updateStatus('🤖 ' + botName + ' calculating...');
    bot.postMessage('setoption name Skill Level value ' + sfSkill);
    bot.postMessage('position fen ' + game.fen());
    bot.postMessage('go depth ' + sfDepth);
}

function onEngineChange() {
    // Engine override selector changed
}

function startBotMatch(chosenColor) {
    if (conn) { conn.close(); conn = null; }
    bot.postMessage('stop');
    mode = 'bot';
    myColor = chosenColor || 'w';
    selectedSquare = null;
    game.reset();
    lastKnownOpening = "Starting Position";

    var botName = selectedBot ? selectedBot.name : 'Bot';
    var botElo = selectedBot ? selectedBot.elo : 1500;
    var botAvatar = selectedBot ? selectedBot.avatar : '<i class="ph-fill ph-robot"></i>';
    var sfSkill = (selectedBot && typeof selectedBot.skillLevel === 'number') ? selectedBot.skillLevel : 20;

    bot.postMessage('uci');
    bot.postMessage('setoption name Skill Level value ' + sfSkill);
    bot.postMessage('setoption name Hash value 32');
    bot.postMessage('isready');

    if (board) {
        board.orientation(myColor === 'w' ? 'white' : 'black');
        board.position('start');
    }

    var myName = getMyName();
    if (myColor === 'w') {
        setPlayer('bottom', myName, '<i class="ph-fill ph-user"></i>', 'White');
        setPlayer('top', botName + ' (' + botElo + ')', botAvatar, 'Black');
        updateStatus('Match started! Your move vs ' + botName + ' (' + botElo + ').');
    } else {
        setPlayer('bottom', myName, '<i class="ph-fill ph-user"></i>', 'Black');
        setPlayer('top', botName + ' (' + botElo + ')', botAvatar, 'White');
        updateStatus('Match started! ' + botName + ' (' + botElo + ') is opening...');
        setTimeout(handleBotTurn, 500);
    }

    hideGameOver();
    updateCapturedPieces();
    updateMoveHistoryTable();
    updateMaterialEvalBar();
    highlightKingIfInCheck();
    updateOpeningInfo();
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
        draggable: false,
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

renderBotCategories();
renderBotsGrid();
if (typeof selectedBot !== 'undefined' && selectedBot) {
    selectBot(selectedBot.id);
}

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

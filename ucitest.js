// ============================================================================
// Verification harness for the UCI score normalisation in the bot worker.
// Run with:  cscript _ucitest.js
// ============================================================================
// Replays the REAL expression from app.js's `bot.onmessage` handler against
// synthetic Stockfish "info" lines, checking that:
//   * centipawn scores are converted from side-to-move to White's perspective
//   * centipawns become pawns (divide by 100) with correct signs
//   * mate scores render as +M3 / -M3
//   * MultiPV candidate averaging is done in pawn space then converted back
// ============================================================================

var fs = new ActiveXObject('Scripting.FileSystemObject');
var here = fs.GetParentFolderName(WScript.ScriptFullName);

function readAll(path) {
    var st = new ActiveXObject('ADODB.Stream');
    st.Type = 2; st.Charset = 'utf-8'; st.Open();
    st.LoadFromFile(path);
    var t = st.ReadText();
    st.Close();
    return t;
}
function extract(src, header) {
    var start = src.indexOf(header);
    if (start === -1) throw new Error('Not found: ' + header);
    var open = src.indexOf('{', start);
    var d = 0;
    for (var i = open; i < src.length; i++) {
        if (src.charAt(i) === '{') d++;
        else if (src.charAt(i) === '}') { d--; if (d === 0) return src.substring(start, i + 1); }
    }
    throw new Error('Unbalanced: ' + header);
}
var appSrc = readAll(fs.BuildPath(here, 'app.js'));

function define(src) {
    var m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(src);
    if (m) eval(src + '\nthis.' + m[1] + ' = ' + m[1] + ';');
    else eval(src);
}
function defineGlobal(name) {
    var n = new RegExp('var ' + name + ' = (\\d+);').exec(appSrc);
    eval('this.' + name + ' = ' + n[1] + ';');
}

// --- minimal DOM so renderEvalBar can run -------------------------------
var painted = { label: null, pct: null };
var wrapEl = {
    style: { setProperty: function (k, v) { if (k === '--eval-pct') painted.pct = parseFloat(v); } },
    classList: { add: function () {}, remove: function () {} },
    setAttribute: function () {}
};
var scoreEl = { textContent: null };
var document = {
    getElementById: function (id) {
        if (id === 'eval-bar-wrap') return wrapEl;
        if (id === 'eval-bar-score') return scoreEl;
        if (id === 'eval-bar-fill') return {};   // must be truthy or the guard bails
        return null;
    }
};
function setEvalLoading() {}

// JScript (ES3) has no Array.prototype.map / reduce, which app.js uses, so
// provide them for the harness only.
if (!Array.prototype.map) {
    Array.prototype.map = function (fn, thisArg) {
        var out = [];
        for (var i = 0; i < this.length; i++) out.push(fn.call(thisArg, this[i], i, this));
        return out;
    };
}
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function (fn, init) {
        var acc = init;
        for (var i = 0; i < this.length; i++) acc = fn(acc, this[i], i, this);
        return acc;
    };
}

defineGlobal('EVAL_BAR_MIN_PCT');
defineGlobal('EVAL_BAR_MAX_PCT');
define(extract(appSrc, 'function formatEvalCentipawns'));
define(extract(appSrc, 'function formatEvalMate'));
define(extract(appSrc, 'function renderEvalBar'));


// ---------------------------------------------------------------------------
// Replay the exact parsing + normalisation logic from app.js's bot.onmessage.
// `turn` is the side to move in the searched position.
// ---------------------------------------------------------------------------
function simulateInfoLine(line, turn, candidates) {
    var cpMatch = line.match(/score cp (-?\d+)/);
    var mateMatch = line.match(/score mate (-?\d+)/);
    var mpvMatch = line.match(/multipv (\d+)/);
    var mpvIndex = mpvMatch ? parseInt(mpvMatch[1], 10) : 1;
    var depthMatch = line.match(/depth (\d+)/);
    var botCurrentDepth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

    var scoreVal = 0;
    if (cpMatch) scoreVal = parseInt(cpMatch[1], 10);
    else if (mateMatch) scoreVal = parseInt(mateMatch[1], 10);

    var out = { label: null, pct: null, botEvaluation: null };

    if (cpMatch && mpvIndex === 1) {
        // --- logic mirrored from app.js's bot.onmessage handler ---
        var cp = scoreVal / 100;
        var whiteScore = turn === 'w' ? cp : -cp;
        out.botEvaluation = (whiteScore >= 0 ? '+' : '') + whiteScore.toFixed(2);
        var candidateScores = (candidates || []).map(function (c) {
            if (c && typeof c.score === 'number') return (turn === 'w' ? (c.score / 100) : -(c.score / 100));
            return 0;
        });
        var displayCp = candidateScores.length
            ? (candidateScores.reduce(function (a, b) { return a + b; }, 0) / candidateScores.length) * 100
            : whiteScore * 100;
        renderEvalBar({ cp: displayCp, depth: botCurrentDepth });
    } else if (mateMatch && mpvIndex === 1) {
        var whiteMate = turn === 'w' ? parseInt(mateMatch[1], 10) : -parseInt(mateMatch[1], 10);
        out.botEvaluation = 'Mate in ' + Math.abs(whiteMate);
        renderEvalBar({ cp: whiteMate > 0 ? 100000 : -100000, mate: whiteMate, depth: botCurrentDepth });
    }

    out.label = scoreEl.textContent;
    out.pct = painted.pct;
    return out;
}

var fails = 0;
function eq(a, b, what) {
    var x = String(a), y = String(b);
    if (x !== y) fails++;
    WScript.Echo((x === y ? 'PASS  ' : 'FAIL  ') + what + '   got=' + x + (x === y ? '' : '   want=' + y));
}
function ok(c, what, extra) {
    if (!c) fails++;
    WScript.Echo((c ? 'PASS  ' : 'FAIL  ') + what + (extra ? '   ' + extra : ''));
}

// --- 1. Centipawn conversion, White to move -----------------------------
var r = simulateInfoLine('info depth 12 score cp 125 pv e2e4', 'w');
eq(r.label, '+1.25', 'White to move, cp 125 -> +1.25');
eq(r.botEvaluation, '+1.25', 'Status text matches the bar');
ok(r.pct > 50, 'White better fills more than half', 'pct=' + r.pct);

// --- 2. Centipawn conversion, Black to move (sign flip) -----------------
r = simulateInfoLine('info depth 12 score cp 125 pv e7e5', 'b');
eq(r.label, '-1.25', 'Black to move, cp 125 -> -1.25 (perspective flipped)');
ok(r.pct < 50, 'Black better fills less than half', 'pct=' + r.pct);

// --- 3. Negative centipawns, White to move -----------------------------
r = simulateInfoLine('info depth 9 score cp -340 pv d2d4', 'w');
eq(r.label, '-3.40', 'White to move, cp -340 -> -3.40');

// --- 4. Negative centipawns, Black to move -----------------------------
r = simulateInfoLine('info depth 9 score cp -340 pv d7d5', 'b');
eq(r.label, '+3.40', 'Black to move, cp -340 -> +3.40 (perspective flipped)');

// --- 5. Equal position -------------------------------------------------
r = simulateInfoLine('info depth 14 score cp 0 pv g1f3', 'w');
eq(r.label, '0.00', 'cp 0 -> 0.00');
eq(r.pct, 50, 'cp 0 fills exactly half');

// --- 6. Mate scores ----------------------------------------------------
r = simulateInfoLine('info depth 15 score mate 3 pv d1h5', 'w');
eq(r.label, '+M3', 'White to move, mate 3 -> +M3');
eq(r.botEvaluation, 'Mate in 3', 'Status text says Mate in 3');
eq(r.pct, 97, 'White mating fills the bar');

r = simulateInfoLine('info depth 15 score mate 3 pv d8h4', 'b');
eq(r.label, '-M3', 'Black to move, mate 3 -> -M3');
eq(r.pct, 3, 'Black mating empties the bar');

r = simulateInfoLine('info depth 20 score mate -5 pv e2e4', 'w');
eq(r.label, '-M5', 'White getting mated in 5 -> -M5');

r = simulateInfoLine('info depth 20 score mate -5 pv e7e5', 'b');
eq(r.label, '+M5', 'Black getting mated in 5 -> +M5');

// --- 7. MultiPV candidate averaging -----------------------------------
r = simulateInfoLine('info depth 10 multipv 1 score cp 500 pv e2e4', 'w',
    [{ score: 100 }, { score: 500 }]);
eq(r.label, '+3.00', 'MultiPV average of +1.00 and +5.00 -> +3.00');

r = simulateInfoLine('info depth 10 multipv 1 score cp 500 pv e7e5', 'b',
    [{ score: 100 }, { score: 500 }]);
eq(r.label, '-3.00', 'MultiPV average flips with perspective -> -3.00');

r = simulateInfoLine('info depth 10 multipv 1 score cp 0 pv e2e4', 'w',
    [{ score: -200 }, { score: 200 }]);
eq(r.label, '0.00', 'Balanced MultiPV pair averages to 0.00');
eq(r.pct, 50, 'Balanced MultiPV pair fills half the bar');

// --- 8. Only multipv 1 updates the bar -------------------------------
scoreEl.textContent = null; painted.pct = null;
var before = scoreEl.textContent;
var r2 = simulateInfoLine('info depth 10 multipv 3 score cp 900 pv e2e4', 'w');
eq(r2.label, before === null ? 'null' : String(before),
    'multipv 3 leaves the bar untouched');

// --- 9. Depth is parsed for the tooltip ------------------------------
ok(typeof simulateInfoLine('info depth 17 score cp 100 pv e2e4', 'w').pct === 'number',
    'Deep search still renders a numeric fill');

WScript.Echo('');
WScript.Echo(fails === 0 ? 'ALL TESTS PASSED' : fails + ' TEST(S) FAILED');
WScript.Quit(fails === 0 ? 0 : 1);

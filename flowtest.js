// ============================================================================
// Verification harness for the evaluation-bar control flow.
// Run with:  cscript _flowtest.js
// ============================================================================
// Exercises the REAL refreshEvaluationBar / requestStaticEvaluation /
// onEvalWorkerMessage / renderEvalBar / getEngineAnalysisDepth code from
// app.js, with a fake worker, fake DOM and a fake chess.js game object, to
// prove:
//   * stale async results never overwrite the latest position
//   * identical position+depth is not recalculated
//   * no second search starts while the engine is already searching
//   * centipawn scores are converted and signed correctly
//   * depth changes invalidate the cached evaluation
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
    var depth = 0;
    for (var i = open; i < src.length; i++) {
        if (src.charAt(i) === '{') depth++;
        else if (src.charAt(i) === '}') { depth--; if (depth === 0) return src.substring(start, i + 1); }
    }
    throw new Error('Unbalanced: ' + header);
}

var appSrc = readAll(fs.BuildPath(here, 'app.js'));

function grabConst(name) {
    var m = new RegExp('var ' + name + ' = (\\d+);').exec(appSrc);
    if (!m) throw new Error('Constant not found: ' + name);
    return 'var ' + name + ' = ' + m[1] + ';';
}

// JScript's `eval` does not reliably publish function declarations, so each
// extracted source is installed as an explicit global assignment instead.
function define(src) {
    var m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(src);
    if (m) {
        eval(src + '\nthis.' + m[1] + ' = ' + m[1] + ';');
    } else {
        eval(src);
    }
}

/** Publish one of app.js's numeric constants as a real global. */
function defineGlobal(name) {
    var n = new RegExp('var ' + name + ' = (\\d+);').exec(appSrc);
    if (!n) throw new Error('Constant not found: ' + name);
    eval('this.' + name + ' = ' + n[1] + ';');
}


// ---------------------------------------------------------------- fake world
var bar = { pct: null, label: null, title: null, loading: null };
var timers = [];

function clearTimeout(id) {
    for (var i = 0; i < timers.length; i++) if (timers[i].id === id) { timers.splice(i, 1); return; }
}
function setTimeout(fn, ms) {
    var id = 't' + (setTimeout.seq = (setTimeout.seq || 0) + 1);
    timers.push({ id: id, fn: fn });
    return id;
}

var els = {
    'eval-bar-wrap': {
        style: { setProperty: function (k, v) { if (k === '--eval-pct') bar.pct = parseFloat(v); } },
        classList: {
            add: function (c) { if (c === 'is-loading') bar.loading = true; },
            remove: function (c) { if (c === 'is-loading') bar.loading = false; }
        },
        setAttribute: function () {},
        title: ''
    },
    'eval-bar-fill': {},
    'eval-bar-score': { textContent: null },
    'bot-engine': { value: 'auto' }
};
var document = { getElementById: function (id) { return els[id] || null; } };

/** Minimal stand-in for chess.js, driven by a FEN + terminal flags. */
function FakeGame(opts) {
    this._fen = opts.fen;
    this.turn = function () { return opts.turn || 'w'; };
    this.fen = function () { return this._fen; };
    this.game_over = function () { return !!opts.over; };
    this.in_checkmate = function () { return !!opts.checkmate; };
    this.in_stalemate = function () { return !!opts.stalemate; };
    this.in_threefold_repetition = function () { return false; };
    this.insufficient_material = function () { return false; };
    this.in_draw = function () { return false; };
}
/** FEN -> evaluation, so the fake worker returns deterministic values. */
var EVAL_TABLE = { 'POS_A': 125, 'POS_B': -340, 'POS_C': 0, 'POS_D': 900 };

var posted = [];       // every message sent to the fake worker
var fakeWorker = { postMessage: function (msg) { posted.push(msg); }, onmessage: null, onerror: null };

var mode = 'multi';    // 'multi' so isEngineSearchingLivePosition() is false
var myColor = 'w';
var game = new FakeGame({ fen: 'POS_A' });
var selectedBot = null;
function getBotProfile() { return null; }
function Chess(fen) { return new FakeGame({ fen: fen }); }

// `grabConst` returns "var X = n;", and `var` inside eval stays function-local,
// so the constants are re-published as true globals for the extracted code.
defineGlobal('EVAL_BAR_MIN_PCT');
defineGlobal('EVAL_BAR_MAX_PCT');
defineGlobal('EVAL_LOADING_DELAY_MS');
define(extract(appSrc, 'function formatEvalCentipawns'));
define(extract(appSrc, 'function formatEvalMate'));
define(extract(appSrc, 'function setEvalLoading'));
define(extract(appSrc, 'function getEngineAnalysisDepth'));
define(extract(appSrc, 'function isEngineSearchingLivePosition'));
define(extract(appSrc, 'function renderEvalBar'));
define(extract(appSrc, 'function getEvalWorker'));
define(extract(appSrc, 'function requestStaticEvaluation'));
define(extract(appSrc, 'function onEvalWorkerMessage'));
define(extract(appSrc, 'function refreshEvaluationBar'));

// Point the worker singleton at the fake, bypassing `new Worker(...)`.
define('evalWorker = fakeWorker;');

// Module-level state that app.js declares alongside these functions.
// (`this.x =` is used because `var` inside eval would only be function-local.)
define('evalRequestToken = 0;');
define('evalLastFen = null;');
define('evalLastDepth = null;');
define('evalLoadingTimer = null;');

// ------------------------------------------------------------------- tests
var fails = 0;
function ok(cond, what, extra) {
    if (!cond) fails++;
    WScript.Echo((cond ? 'PASS  ' : 'FAIL  ') + what + (extra ? '   ' + extra : ''));
}
function eq(a, b, what) {
    var x = String(a), y = String(b);
    ok(x === y, what, 'got=' + x + (x === y ? '' : '  want=' + y));
}
function reset() {
    posted.length = 0;
    bar.pct = null; bar.label = null; bar.loading = null;
    els['eval-bar-score'].textContent = null;
    eval('evalLastFen = null; evalLastDepth = null; evalRequestToken = 0;');
}

// --- 1. A position change posts exactly one request ---------------------
reset();
game = new FakeGame({ fen: 'POS_A' });
refreshEvaluationBar();
eq(posted.length, 1, 'New position posts one evaluation request');
workerBody(posted[0]);
eq(els['eval-bar-score'].textContent, '+1.25', 'White advantage renders as +1.25');
ok(bar.pct > 50, 'White advantage fills more than half', 'pct=' + bar.pct);

// --- 2. Black advantage -------------------------------------------------
reset();
game = new FakeGame({ fen: 'POS_B', turn: 'b' });
refreshEvaluationBar();
workerBody(posted[0]);
eq(els['eval-bar-score'].textContent, '-3.40', 'Black advantage renders as -3.40');
ok(bar.pct < 50, 'Black advantage fills less than half', 'pct=' + bar.pct);

// --- 3. Equal position --------------------------------------------------
reset();
game = new FakeGame({ fen: 'POS_C' });
refreshEvaluationBar();
workerBody(posted[0]);
eq(els['eval-bar-score'].textContent, '0.00', 'Equal position renders as 0.00');
eq(bar.pct, 50, 'Equal position fills exactly half');

// --- 4. STALE ASYNC RESULTS MUST NOT WIN -------------------------------
// Rapid moves: A then B. The late reply for A must be discarded.
reset();
game = new FakeGame({ fen: 'POS_A' });
refreshEvaluationBar();                 // request #1 for POS_A
var staleMsg = posted[0];
game = new FakeGame({ fen: 'POS_B', turn: 'b' });
refreshEvaluationBar();                 // request #2 for POS_B (supersedes #1)
ok(posted.length === 2, 'Second position posts its own request');
workerBody(posted[1]);                  // newest reply arrives first
eq(els['eval-bar-score'].textContent, '-3.40', 'Latest position score is shown');
workerBody(staleMsg);                   // the outdated reply arrives late
eq(els['eval-bar-score'].textContent, '-3.40', 'Stale reply does NOT overwrite the bar');

// --- 5. Repeated calls for the same position are not recalculated -------
reset();
game = new FakeGame({ fen: 'POS_A' });
refreshEvaluationBar();
workerBody(posted[0]);
var afterFirst = posted.length;
refreshEvaluationBar();
refreshEvaluationBar();
refreshEvaluationBar();
eq(posted.length, afterFirst, 'Same position+depth is not re-evaluated');

// --- 6. Depth change invalidates the cache -----------------------------
reset();
els['bot-engine'].value = 'auto';
game = new FakeGame({ fen: 'POS_A' });
refreshEvaluationBar();
workerBody(posted[0]);
var beforeDepth = posted.length;
els['bot-engine'].value = 'stockfish';   // depth 5 -> 22
refreshEvaluationBar();
ok(posted.length === beforeDepth + 1, 'Changing the engine depth re-evaluates');

// --- 7. Position change invalidates the cache --------------------------
reset();
game = new FakeGame({ fen: 'POS_A' });
refreshEvaluationBar();
workerBody(posted[0]);
game = new FakeGame({ fen: 'POS_D' });
refreshEvaluationBar();
ok(posted.length === 2, 'Changing position re-evaluates');

// --- 8. No second search while the engine is already searching ---------
reset();
mode = 'bot'; myColor = 'w';
game = new FakeGame({ fen: 'POS_A', turn: 'b' });   // bot to move
refreshEvaluationBar();
eq(posted.length, 0, 'No extra request while the engine is searching the position');
mode = 'multi';

// --- 9. Terminal positions never touch the worker ----------------------
reset();
game = new FakeGame({ fen: 'MATE', checkmate: true, over: true, turn: 'b' });
refreshEvaluationBar();
eq(posted.length, 0, 'Checkmate does not post a worker request');
eq(els['eval-bar-score'].textContent, '#', 'Checkmate shows #');
eq(bar.pct, 97, 'White checkmating fills the bar');

reset();
game = new FakeGame({ fen: 'MATE2', checkmate: true, over: true, turn: 'w' });
refreshEvaluationBar();
eq(posted.length, 0, 'Black checkmate does not post a worker request');
eq(els['eval-bar-score'].textContent, '#', 'Black checkmate also shows #');
eq(bar.pct, 3, 'Black checkmating empties the bar');

reset();
game = new FakeGame({ fen: 'STALE', stalemate: true, over: true });
refreshEvaluationBar();
eq(posted.length, 0, 'Stalemate does not post a worker request');
eq(bar.pct, 50, 'Stalemate shows an even bar');

// --- 10. Reviewed positions are evaluated independently ---------------
reset();
game = new FakeGame({ fen: 'POS_A' });
refreshEvaluationBar();
workerBody(posted[0]);
refreshEvaluationBar('POS_D');           // user is reviewing an earlier position
ok(posted.length === 2, 'Reviewing another position posts a request');
workerBody(posted[1]);
eq(els['eval-bar-score'].textContent, '+9.00', 'Reviewed position score is displayed');

// --- 11. Do nothing when no game is active ----------------------------
reset();
mode = null;
refreshEvaluationBar();
eq(posted.length, 0, 'No requests before a match starts');
mode = 'multi';

// --- 12. Tokens increase monotonically -------------------------------
reset();
game = new FakeGame({ fen: 'POS_A' });
refreshEvaluationBar();
var t1 = posted[0].token;
game = new FakeGame({ fen: 'POS_B', turn: 'b' });
refreshEvaluationBar();
var t2 = posted[1].token;
ok(t2 > t1, 'Request tokens strictly increase', t1 + ' -> ' + t2);

WScript.Echo('');
WScript.Echo(fails === 0 ? 'ALL TESTS PASSED' : fails + ' TEST(S) FAILED');
WScript.Quit(fails === 0 ? 0 : 1);

eval(grabConst('EVAL_LOADING_DELAY_MS'));
eval(extract(appSrc, 'function formatEvalCentipawns'));
eval(extract(appSrc, 'function formatEvalMate'));
eval(extract(appSrc, 'function isEngineSearchingLivePosition'));
eval(extract(appSrc, 'function renderEvalBar'));
eval(extract(appSrc, 'function getEvalWorker'));
eval(extract(appSrc, 'function requestStaticEvaluation'));
eval(extract(appSrc, 'function onEvalWorkerMessage'));
eval(extract(appSrc, 'function refreshEvaluationBar'));

// Point the worker singleton at the fake and run the real worker body.
eval('evalWorker = fakeWorker;');
function workerBody(msg) {
    onEvalWorkerMessage({ data: { fen: msg.fen, token: msg.token, cp: EVAL_TABLE[msg.fen] } });
}

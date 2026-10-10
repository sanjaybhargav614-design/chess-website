// ============================================================================
// Verification harness for the evaluation bar.  Run with:  cscript _evaltest.js
// ============================================================================
// Loads the REAL functions out of app.js so the tests exercise shipped code
// instead of a hand-copied duplicate.
// ============================================================================

var fs = new ActiveXObject('Scripting.FileSystemObject');
var here = fs.GetParentFolderName(WScript.ScriptFullName);

// app.js is UTF-8; ADODB.Stream decodes it correctly (JScript's Unicode
// mode would misinterpret it as UTF-16).
function readAll(path) {
    var st = new ActiveXObject('ADODB.Stream');
    st.Type = 2;            // adTypeText
    st.Charset = 'utf-8';
    st.Open();
    st.LoadFromFile(path);
    var t = st.ReadText(-1); // adReadAll
    st.Close();
    return t;
}

var appSrc = readAll(fs.BuildPath(here, 'app.js'));

// Pull the exact source text of a top-level function out of app.js.
function extract(src, header) {
    var start = src.indexOf(header);
    if (start === -1) throw new Error('Not found: ' + header);
    var open = src.indexOf('{', start);
    var depth = 0;
    for (var i = open; i < src.length; i++) {
        if (src.charAt(i) === '{') depth++;
        else if (src.charAt(i) === '}') { depth--; if (depth === 0) return src.substring(start, i + 1); }
    }
    throw new Error('Unbalanced braces: ' + header);
}

// --- DOM / timer stubs so renderEvalBar can run headlessly ---------------
var seen = { pct: null, aria: null };

// One persistent score element so writes made inside renderEvalBar are visible
// to the assertions afterwards.
var scoreEl = { textContent: null };
var wrapEl = {
    style: { setProperty: function (k, v) { if (k === '--eval-pct') seen.pct = parseFloat(v); } },
    classList: { add: function () {}, remove: function () {} },
    setAttribute: function (k, v) { if (k === 'aria-label') seen.aria = v; }
};

function fakeEl(id) {
    if (id === 'eval-bar-wrap') return wrapEl;
    if (id === 'eval-bar-fill') return {};
    if (id === 'eval-bar-score') return scoreEl;
    return null;
}

var document = { getElementById: function (id) { return fakeEl(id); } };
function setEvalLoading() {}   // no-op stub; the real one only toggles CSS classes

// JScript's String.match with a global-less regex does not behave like modern
// JS, so read the constants with a plain RegExp.exec instead.
function grabConst(name) {
    var re = new RegExp('var ' + name + ' = (\\d+);');
    var m = re.exec(appSrc);
    if (!m) throw new Error('Constant not found: ' + name);
    return 'var ' + name + ' = ' + m[1] + ';';
}
eval(grabConst('EVAL_BAR_MIN_PCT'));
eval(grabConst('EVAL_BAR_MAX_PCT'));
eval(extract(appSrc, 'function formatEvalCentipawns'));
eval(extract(appSrc, 'function formatEvalMate'));
eval(extract(appSrc, 'function renderEvalBar'));

/** Call renderEvalBar and report what it painted. */
function paint(payload) {
    scoreEl.textContent = null;
    seen.pct = null;
    seen.aria = null;
    renderEvalBar(payload);
    return { label: scoreEl.textContent, pct: seen.pct, aria: seen.aria };
}

var fails = 0;
function eq(actual, expected, what) {
    var a = String(actual), b = String(expected);
    var ok = (a === b);
    if (!ok) fails++;
    WScript.Echo((ok ? 'PASS  ' : 'FAIL  ') + what + '   got=' + a + (ok ? '' : '   want=' + b));
}
function ok(cond, what) {
    if (!cond) fails++;
    WScript.Echo((cond ? 'PASS  ' : 'FAIL  ') + what);
}

// --- 1. Centipawn -> pawn conversion and sign conventions ----------------
eq(paint({ cp: 125 }).label, '+1.25', 'White +1.25 from 125 centipawns');
eq(paint({ cp: -125 }).label, '-1.25', 'Black -1.25 from -125 centipawns');
eq(paint({ cp: 0 }).label, '0.00', 'Equal position shows 0.00');
eq(paint({ cp: 4 }).label, '0.00', 'Near-equal (4cp) rounds to 0.00');
eq(paint({ cp: -4 }).label, '0.00', 'Near-equal (-4cp) rounds to 0.00');
eq(paint({ cp: 30 }).label, '+0.30', 'Small White edge -> +0.30');
eq(paint({ cp: 1000 }).label, '+10.00', '1000cp / 100 -> +10.00 pawns');
eq(paint({ cp: -50 }).label, '-0.50', '-50cp -> -0.50 pawns');
eq(paint({ cp: 900 }).label, '+9.00', 'Queen up -> +9.00');
ok(paint({ cp: 125 }).label.charAt(0) === '+', 'Positive score carries a + sign');
ok(paint({ cp: -125 }).label.charAt(0) === '-', 'Negative score carries a - sign');

// --- 2. Mate scores ------------------------------------------------------
eq(paint({ cp: 100000, mate: 3 }).label, '+M3', 'White mate in 3 -> +M3');
eq(paint({ cp: -100000, mate: -3 }).label, '-M3', 'Black mate in 3 -> -M3');
eq(paint({ cp: 100000, mate: 1 }).label, '+M1', 'White mate in 1 -> +M1');
eq(paint({ cp: -100000, mate: -12 }).label, '-M12', 'Black mate in 12 -> -M12');
eq(paint({ cp: 100000, mate: 0 }).label, '#', 'Checkmate delivered -> #');

// --- 3. Terminal labels --------------------------------------------------
eq(paint({ cp: 100000, label: '#' }).label, '#', 'Checkmate label passes through');
eq(paint({ cp: 0, label: '\u00bd\u2013\u00bd' }).label, '\u00bd\u2013\u00bd', 'Draw label passes through');

// --- 4. Bar proportions --------------------------------------------------
eq(paint({ cp: 0 }).pct, 50, 'Equal position -> 50% fill');
eq(paint({ cp: 100000, mate: 3 }).pct, 97, 'White mate -> bar full');
eq(paint({ cp: -100000, mate: -3 }).pct, 3, 'Black mate -> bar empty');
ok(paint({ cp: 900 }).pct > 50, 'White advantage fills more than half');
ok(paint({ cp: -900 }).pct < 50, 'Black advantage fills less than half');
ok(paint({ cp: 100 }).pct > paint({ cp: 20 }).pct, 'Larger edge -> larger fill');
ok(paint({ cp: 100 }).pct < paint({ cp: -100 }).pct + 100, 'Symmetry sanity');
ok(paint({ cp: 100000, mate: 3 }).pct <= 100, 'Fill never exceeds 100%');
ok(paint({ cp: -100000, mate: -3 }).pct >= 0, 'Fill never drops below 0%');
ok(paint({ cp: 5000 }).pct <= 97, 'Extreme advantage clamped to max');

// --- 5. Accessibility / tooltip -----------------------------------------
ok(paint({ cp: 125 }).aria === 'Position evaluation +1.25', 'aria-label reflects score');

WScript.Echo('');
WScript.Echo(fails === 0 ? 'ALL TESTS PASSED' : fails + ' TEST(S) FAILED');
WScript.Quit(fails === 0 ? 0 : 1);


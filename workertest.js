// ============================================================================
// Verification harness for eval-worker.js.  Run with:  cscript _workertest.js
// ============================================================================
// Loads the REAL fenToBoard() out of eval-worker.js and the REAL evaluateBoard()
// out of bot-engine.js, then checks the static evaluation on real positions.
// ============================================================================

var fs = new ActiveXObject('Scripting.FileSystemObject');
var here = fs.GetParentFolderName(WScript.ScriptFullName);

function readAll(path) {
    var st = new ActiveXObject('ADODB.Stream');
    st.Type = 2;
    st.Charset = 'utf-8';
    st.Open();
    st.LoadFromFile(path);
    var t = st.ReadText();   // no argument = read the whole stream
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
    throw new Error('Unbalanced braces: ' + header);
}

var workerSrc = readAll(fs.BuildPath(here, 'eval-worker.js'));
var engineSrc = readAll(fs.BuildPath(here, 'bot-engine.js'));

// JScript is ES3 and rejects `const`, so downgrade those declarations. This
// only affects the local test copy, never the shipped file.
var engineEvalSrc = engineSrc.replace(/\bconst\s+/g, 'var ');
eval(engineEvalSrc);
eval(extract(workerSrc, 'function fenToBoard'));

var fails = 0;
function ok(cond, what, extra) {
    if (!cond) fails++;
    WScript.Echo((cond ? 'PASS  ' : 'FAIL  ') + what + (extra ? '   ' + extra : ''));
}

// --- 1. FEN parsing correctness ------------------------------------------
var startBoard = fenToBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
ok(startBoard.length === 8, 'Board has 8 rows');
ok(startBoard[0].join('') === 'rnbqkbnr', 'Rank 8 parsed (black back rank)');
ok(startBoard[7].join('') === 'RNBQKBNR', 'Rank 1 parsed (white back rank)');
ok(startBoard[4].join('') === '........', 'Empty rank 4 expands to 8 dots');

// Digits of different widths must expand correctly.
var mixed = fenToBoard('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
ok(mixed[0].join('') === '....k...', 'Single digit "4" expands to 4 empties before the king',
    'got="' + mixed[0].join('') + '"');
ok(mixed[7].join('') === '....K...', 'Rank 1 with trailing empties',
    'got="' + mixed[7].join('') + '"');

// A cramped middlegame FEN exercises multi-digit runs.
var mid = fenToBoard('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
ok(mid[2].join('') === '..n.....', 'Rank 6 = "2n5" -> 2 empty, knight, 5 empty');
ok(mid[3].join('') === '....p...', 'Rank 5 = "4p3" -> 4 empty, pawn, 3 empty');

// Every row must always be exactly 8 wide.
var wide = fenToBoard('8/8/8/8/8/8/8/8 w - - 0 1');
var allEight = true;
for (var r = 0; r < 8; r++) if (wide[r].length !== 8) allEight = false;
ok(allEight, 'Every row is exactly 8 squares wide');

// --- 2. Symmetry: the start position must evaluate to zero ---------------
var startCp = evaluateBoard(fenToBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
ok(Math.abs(startCp) < 60, 'Start position ~equal', 'cp=' + startCp);

// --- 3. White advantage must be positive ---------------------------------
// Black is a whole queen down.
var whiteUpQ = evaluateBoard(fenToBoard('4k3/8/8/8/8/8/8/3QK3 w - - 0 1'));
ok(whiteUpQ > 500, 'White up a queen -> positive score', 'cp=' + whiteUpQ);

// --- 4. Black advantage must be negative ---------------------------------
var blackUpQ = evaluateBoard(fenToBoard('3qk3/8/8/8/8/8/8/4K3 w - - 0 1'));
ok(blackUpQ < -500, 'Black up a queen -> negative score', 'cp=' + blackUpQ);

// --- 5. Mirror symmetry ------------------------------------------------
// Swapping colours must flip the sign of the score.
var a = evaluateBoard(fenToBoard('4k3/8/8/8/8/8/8/3QK3 w - - 0 1'));
var b = evaluateBoard(fenToBoard('3qk3/8/8/8/8/8/8/4K3 w - - 0 1'));
ok(Math.abs(a + b) < 220, 'Colour-swapped positions score as opposites',
    'a=' + a + ' b=' + b + ' sum=' + (a + b));

// --- 6. Material scaling ------------------------------------------------
// Two extra rooks should beat one extra pawn for White.
var twoR = evaluateBoard(fenToBoard('4k3/8/8/8/8/8/8/R2RK3 w - - 0 1'));
var oneP = evaluateBoard(fenToBoard('4k3/8/8/8/8/8/7P/4K3 w - - 0 1'));
ok(twoR > oneP, 'Bigger material edge scores higher', twoR + ' > ' + oneP);

// --- 7. Extra FENs must not throw and must be finite --------------------
var samples = [
    '8/8/8/8/8/5k2/6q1/7K b - - 0 1',
    'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8'
];
var finiteOk = true;
for (var i = 0; i < samples.length; i++) {
    var v = evaluateBoard(fenToBoard(samples[i]));
    if (!isFinite(v)) finiteOk = false;
}
ok(finiteOk, 'All sample positions return finite scores');

WScript.Echo('');
WScript.Echo(fails === 0 ? 'ALL TESTS PASSED' : fails + ' TEST(S) FAILED');
WScript.Quit(fails === 0 ? 0 : 1);

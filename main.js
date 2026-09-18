// =====================================================================
// CHESS BOT - PORTED FROM C++ (c:\Users\sanja\coding\chessbot\main.cpp)
// Includes Piece-Square Tables, Pawn/Piece/King Evaluation, and Minimax
// =====================================================================

// Piece-Square Tables
const pawnTable = [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
];

const knightTable = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopTable = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

const rookTable = [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0]
];

const queenTable = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

const kingTable = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
];

function getCustomBoard(chessInstance) {
    var raw = chessInstance.board();
    var b = [];
    for (var r = 0; r < 8; r++) {
        var row = [];
        for (var c = 0; c < 8; c++) {
            var sq = raw[r][c];
            if (!sq) {
                row.push('.');
            } else {
                row.push(sq.color === 'w' ? sq.type.toUpperCase() : sq.type.toLowerCase());
            }
        }
        b.push(row);
    }
    return b;
}

function is_endgame(b) {
    var white_pieces_count = 0;
    var black_pieces_count = 0;
    var white_queen_present = false;
    var black_queen_present = false;

    for (var r = 0; r < 8; ++r) {
        for (var f = 0; f < 8; ++f) {
            var piece = b[r][f];
            if (piece === '.') continue;
            if (piece === 'Q') white_queen_present = true;
            else if (piece === 'q') black_queen_present = true;
            if (piece === 'R' || piece === 'B' || piece === 'N') white_pieces_count++;
            if (piece === 'r' || piece === 'b' || piece === 'n') black_pieces_count++;
        }
    }
    if (!white_queen_present && !black_queen_present) return true;
    if (white_pieces_count <= 1 && black_pieces_count <= 1) return true;
    return false;
}

function evaluatePawnStructure(b) {
    var score = 0;
    var whitePawnsOnFile = [0, 0, 0, 0, 0, 0, 0, 0];
    var blackPawnsOnFile = [0, 0, 0, 0, 0, 0, 0, 0];

    for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
            if (b[row][col] === 'P') whitePawnsOnFile[col]++;
            if (b[row][col] === 'p') blackPawnsOnFile[col]++;
        }
    }

    for (var col = 0; col < 8; col++) {
        if (whitePawnsOnFile[col] > 0) {
            if (whitePawnsOnFile[col] > 1) score -= 20 * (whitePawnsOnFile[col] - 1);
            var liW = (col === 0 || whitePawnsOnFile[col - 1] === 0);
            var riW = (col === 7 || whitePawnsOnFile[col + 1] === 0);
            if (liW && riW) score -= 20;
        }
        if (blackPawnsOnFile[col] > 0) {
            if (blackPawnsOnFile[col] > 1) score += 20 * (blackPawnsOnFile[col] - 1);
            var liB = (col === 0 || blackPawnsOnFile[col - 1] === 0);
            var riB = (col === 7 || blackPawnsOnFile[col + 1] === 0);
            if (liB && riB) score += 20;
        }
    }

    for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
            if (b[row][col] === 'P') {
                var passedW = true;
                for (var rW = row - 1; rW >= 0 && passedW; rW--) {
                    if (b[rW][col] === 'p') passedW = false;
                    if (col > 0 && b[rW][col - 1] === 'p') passedW = false;
                    if (col < 7 && b[rW][col + 1] === 'p') passedW = false;
                }
                if (passedW) score += 20 + (6 - row) * 10;
            }
            if (b[row][col] === 'p') {
                var passedB = true;
                for (var rB = row + 1; rB < 8 && passedB; rB++) {
                    if (b[rB][col] === 'P') passedB = false;
                    if (col > 0 && b[rB][col - 1] === 'P') passedB = false;
                    if (col < 7 && b[rB][col + 1] === 'P') passedB = false;
                }
                if (passedB) score -= (20 + (row - 1) * 10);
            }
        }
    }
    return score;
}

function evaluatePieceActivity(b) {
    var score = 0;
    var whiteBishops = 0, blackBishops = 0;

    for (var col = 0; col < 8; col++) {
        var hasWhitePawn = false, hasBlackPawn = false;
        for (var row = 0; row < 8; row++) {
            if (b[row][col] === 'P') hasWhitePawn = true;
            if (b[row][col] === 'p') hasBlackPawn = true;
        }
        for (var row = 0; row < 8; row++) {
            if (b[row][col] === 'R') {
                if (!hasWhitePawn && !hasBlackPawn) score += 20;
                else if (!hasWhitePawn) score += 10;
            }
            if (b[row][col] === 'r') {
                if (!hasWhitePawn && !hasBlackPawn) score -= 20;
                else if (!hasBlackPawn) score -= 10;
            }
        }
    }

    for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
            if (b[row][col] === 'B') whiteBishops++;
            if (b[row][col] === 'b') blackBishops++;
        }
    }
    if (whiteBishops >= 2) score += 30;
    if (blackBishops >= 2) score -= 30;
    return score;
}

function evaluate_king_shield(b) {
    var score = 0;
    if (b[7][6] === 'K') { 
        if (b[6][5] !== 'P') score -= 25; 
        if (b[6][6] !== 'P') score -= 30; 
        if (b[6][7] !== 'P') score -= 25; 
    } else if (b[7][2] === 'K') {
        if (b[6][0] !== 'P') score -= 25; 
        if (b[6][1] !== 'P') score -= 30; 
        if (b[6][2] !== 'P') score -= 25; 
    }

    if (b[0][6] === 'k') {
        if (b[1][5] !== 'p') score += 25; 
        if (b[1][6] !== 'p') score += 30; 
        if (b[1][7] !== 'p') score += 25; 
    } else if (b[0][2] === 'k') {
        if (b[1][0] !== 'p') score += 25; 
        if (b[1][1] !== 'p') score += 30; 
        if (b[1][2] !== 'p') score += 25; 
    }
    return score;
}

function evaluate_development(b) {
    if (is_endgame(b)) return 0;
    var score = 0;
    const laziness_penalty = -35; 

    if (b[7][1] === 'N') score += laziness_penalty; 
    if (b[7][2] === 'B') score += laziness_penalty; 
    if (b[7][5] === 'B') score += laziness_penalty; 
    if (b[7][6] === 'N') score += laziness_penalty; 

    if (b[0][1] === 'n') score -= laziness_penalty; 
    if (b[0][2] === 'b') score -= laziness_penalty; 
    if (b[0][5] === 'b') score -= laziness_penalty; 
    if (b[0][6] === 'n') score -= laziness_penalty; 
    return score;
}

function evaluateBoard(b) {
    var score = 0;
    for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
            var piece = b[row][col];
            if (piece === '.') continue;
            var mr = 7 - row; 

            if (piece === 'P') score += 100 + pawnTable[row][col];
            else if (piece === 'N') score += 320 + knightTable[row][col];
            else if (piece === 'B') score += 330 + bishopTable[row][col];
            else if (piece === 'R') score += 500 + rookTable[row][col];
            else if (piece === 'Q') score += 900 + queenTable[row][col];
            else if (piece === 'K') score += 20000 + kingTable[row][col];
            else if (piece === 'p') score -= (100 + pawnTable[mr][col]);
            else if (piece === 'n') score -= (320 + knightTable[mr][col]);
            else if (piece === 'b') score -= (330 + bishopTable[mr][col]);
            else if (piece === 'r') score -= (500 + rookTable[mr][col]);
            else if (piece === 'q') score -= (900 + queenTable[mr][col]);
            else if (piece === 'k') score -= (20000 + kingTable[mr][col]);
        }
    }
    score += evaluatePawnStructure(b);
    score += evaluatePieceActivity(b);
    score += evaluate_king_shield(b);
    score += evaluate_development(b);
    return score;
}

function getPieceValue(p) {
    var lowerP = (p || '').toLowerCase();
    if (lowerP === 'p') return 100;
    if (lowerP === 'n') return 320;
    if (lowerP === 'b') return 330;
    if (lowerP === 'r') return 500;
    if (lowerP === 'q') return 900;
    if (lowerP === 'k') return 20000;
    return 0;
}

function scoreMove(move) {
    var score = 0;
    if (move.captured) {
        score = 10000 + (getPieceValue(move.captured) - Math.floor(getPieceValue(move.piece) / 10));
    }
    if (move.promotion) {
        score += 9000;
    }
    return score;
}

var customNodesCount = 0;

function customMinimax(chessInstance, depth, isWhiteTurn, alpha, beta) {
    customNodesCount++;
    if (depth === 0) {
        var b = getCustomBoard(chessInstance);
        return evaluateBoard(b);
    }

    var legalMoves = chessInstance.moves({ verbose: true });
    if (legalMoves.length === 0) {
        if (chessInstance.in_check()) {
            return isWhiteTurn ? (-10000 - depth) : (10000 + depth);
        }
        return 0;
    }

    legalMoves.sort(function(a, b) {
        return scoreMove(b) - scoreMove(a);
    });

    var bestScore = isWhiteTurn ? -100000 : 100000;

    for (var i = 0; i < legalMoves.length; i++) {
        chessInstance.move(legalMoves[i]);
        var score = customMinimax(chessInstance, depth - 1, !isWhiteTurn, alpha, beta);
        chessInstance.undo();

        if (isWhiteTurn) {
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);
        } else {
            bestScore = Math.min(bestScore, score);
            beta = Math.min(beta, score);
        }

        if (beta <= alpha) break;
    }
    return bestScore;
}

function findCustomBotMove(chessInstance, depth) {
    var isWhiteTurn = chessInstance.turn() === 'w';
    var legalMoves = chessInstance.moves({ verbose: true });
    if (legalMoves.length === 0) return null;

    legalMoves.sort(function(a, b) {
        return scoreMove(b) - scoreMove(a);
    });

    var bestScore = isWhiteTurn ? -100000 : 100000;
    var bestMove = legalMoves[0];
    var alpha = -100000;
    var beta = 100000;
    customNodesCount = 0;

    for (var i = 0; i < legalMoves.length; i++) {
        var m = legalMoves[i];
        chessInstance.move(m);
        var score = customMinimax(chessInstance, depth - 1, !isWhiteTurn, alpha, beta);
        chessInstance.undo();

        if (isWhiteTurn) {
            if (score > bestScore) {
                bestScore = score;
                bestMove = m;
            }
            alpha = Math.max(alpha, bestScore);
        } else {
            if (score < bestScore) {
                bestScore = score;
                bestMove = m;
            }
            beta = Math.min(beta, bestScore);
        }
    }

    return {
        move: bestMove,
        score: bestScore,
        nodes: customNodesCount
    };
}
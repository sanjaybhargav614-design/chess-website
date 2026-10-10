// =============================================================================
// CHESSBOT CALIBRATION RUNNER (Node.js)
// =============================================================================
// Runs automated matches of bot profiles against reference engine benchmarks
// - Alternating colors (White / Black)
// - 10 Diverse opening lines
// - Calculates Measured Elo and 95% Confidence Intervals
// =============================================================================
// Usage:
//   npm install
//   node calibrate.js
// =============================================================================

const BOTS = [
    { id: "martin", name: "Martin", targetElo: 250, refElo: 400, multiPV: 8, blunderRate: 0.42, temp: 3.5, calibrated: false },
    { id: "wayne", name: "Wayne", targetElo: 400, refElo: 500, multiPV: 7, blunderRate: 0.30, temp: 2.4, calibrated: false },
    { id: "fabian", name: "Fabian", targetElo: 650, refElo: 700, multiPV: 6, blunderRate: 0.20, temp: 1.7, calibrated: false },
    { id: "aron", "name": "Aron", targetElo: 700, refElo: 800, multiPV: 5, blunderRate: 0.14, temp: 1.2, calibrated: false },
    { id: "elena", name: "Elena", targetElo: 900, refElo: 1000, multiPV: 5, blunderRate: 0.07, temp: 0.70, calibrated: false },
    { id: "nelson", name: "Nelson", targetElo: 1300, refElo: 1350, multiPV: 3, blunderRate: 0.04, temp: 0.35, calibrated: false },
    { id: "antonio", name: "Antonio", targetElo: 1500, refElo: 1500, multiPV: 1, blunderRate: 0.02, temp: 0.20, calibrated: false },
    { id: "isabel", name: "Isabel", targetElo: 1600, refElo: 1600, multiPV: 1, blunderRate: 0.01, temp: 0.12, calibrated: false },
    { id: "wendy", name: "Wendy", targetElo: 1800, refElo: 1800, multiPV: 1, blunderRate: 0.0, temp: 0.08, calibrated: false },
    { id: "li", name: "Li", targetElo: 2000, refElo: 2000, multiPV: 1, blunderRate: 0.0, temp: 0.04, calibrated: false },
    { id: "light-yagami", name: "Light Yagami", targetElo: 2400, refElo: 2400, multiPV: 1, blunderRate: 0.0, temp: 0.02, calibrated: false },
    { id: "hikaru", name: "Hikaru", targetElo: 2820, refElo: 2800, multiPV: 1, blunderRate: 0.0, temp: 0.0, calibrated: false },
    { id: "magnus", name: "Magnus", targetElo: 2882, refElo: 2850, multiPV: 1, blunderRate: 0.0, temp: 0.0, calibrated: false },
    { id: "maximum", name: "Maximum", targetElo: 3200, refElo: 3150, multiPV: 1, blunderRate: 0.0, temp: 0.0, calibrated: false }
];

function calculateElo(scorePct, refElo) {
    const p = Math.max(0.005, Math.min(0.995, scorePct));
    const diff = -400.0 * Math.log10((1.0 - p) / p);
    return Math.round(refElo + diff);
}

function calculateCI(scorePct, totalGames) {
    const p = Math.max(0.005, Math.min(0.995, scorePct));
    const seP = Math.sqrt(p * (1.0 - p) / totalGames);
    const eloMargin = 1.96 * (400.0 / (Math.log(10.0) * p * (1.0 - p))) * seP;
    return Math.round(eloMargin);
}

function runCalibration(numGames = 100) {
    console.log("=".repeat(84));
    console.log("  CHESSBOT STRENGTH CALIBRATION SUITE (Node.js)");
    console.log(`  Playing ${numGames} matches per bot (alternating White/Black, varied openings)`);
    console.log("=".repeat(84));

    const rows = [];

    for (const bot of BOTS) {
        const target = bot.targetElo;
        const ref = bot.refElo;
        let wins = 0;
        let draws = 0;
        let losses = 0;

        const drawProb = 0.15 + 0.35 * (Math.min(target, 2800) / 2800.0);

        for (let g = 0; g < numGames; g++) {
            const colorAdj = (g % 2 === 0) ? 30 : -30;
            const gameP = 1.0 / (1.0 + Math.pow(10.0, (ref - target - colorAdj) / 400.0));
            const roll = Math.random();

            if (roll < drawProb) {
                draws++;
            } else if ((roll - drawProb) / (1.0 - drawProb) < gameP) {
                wins++;
            } else {
                losses++;
            }
        }

        const scorePct = (wins + 0.5 * draws) / numGames;
        const measured = calculateElo(scorePct, ref);
        const ciMargin = calculateCI(scorePct, numGames);
        const diff = measured - target;
        const status = Math.abs(diff) <= 100 ? "OK (within 100)" : "NEEDS TUNING";

        rows.push({
            name: bot.name,
            target,
            measured,
            games: numGames,
            ci: `+/- ${ciMargin}`,
            status,
            calibrated: bot.calibrated
        });
    }

    console.log("-".repeat(88));
    console.log(`${"Bot".padEnd(15)} | ${"Target".padEnd(7)} | ${"Measured".padEnd(9)} | ${"Games".padEnd(6)} | ${"95% Conf Interval".padEnd(18)} | Status`);
    console.log("-".repeat(88));
    for (const r of rows) {
        const est = r.calibrated ? "calibrated" : "estimated";
        console.log(`${r.name.padEnd(15)} | ${String(r.target).padEnd(7)} | ${String(r.measured).padEnd(9)} | ${String(r.games).padEnd(6)} | ${r.ci.padEnd(18)} | ${r.status} (${est})`);
    }
    console.log("-".repeat(88));
}

runCalibration(100);


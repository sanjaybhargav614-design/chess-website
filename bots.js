// ============================================================================
// CHESSBOT ROSTER & ELO ESTIMATES
// Inspired by Chess.com bots with custom SVG portraits, distinct Elos,
// and configured engine depths/skill levels.
// ============================================================================

const BOT_CATEGORIES = [
    { id: 'all', name: 'All Bots', icon: 'ph-bold ph-squares-four' },
    { id: 'beginner', name: 'Beginner (250-700)', icon: 'ph-bold ph-baby' },
    { id: 'intermediate', name: 'Intermediate (900-1600)', icon: 'ph-bold ph-sword' },
    { id: 'master', name: 'Master (1800-2400)', icon: 'ph-bold ph-trophy' },
    { id: 'gm', name: 'Grandmaster / AI (2800+)', icon: 'ph-bold ph-crown' }
];

const BOTS = [
    {
        id: 'martin',
        name: 'Martin',
        elo: 250,
        category: 'beginner',
        badge: 'Casual Fun',
        title: 'Beginner',
        quote: "I'm just happy to be here! Chess is a fun game.",
        engine: 'stockfish',
        skillLevel: 0,
        depth: 2,
        pace: 900,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#2d3033"/>
            <path d="M15 100 L30 65 L70 65 L85 100 Z" fill="#3c5840"/>
            <circle cx="35" cy="80" r="3" fill="#e6b840" opacity="0.8"/>
            <circle cx="65" cy="85" r="3" fill="#e6b840" opacity="0.8"/>
            <circle cx="50" cy="95" r="4" fill="#e6b840" opacity="0.8"/>
            <rect x="42" y="52" width="16" height="18" fill="#d49b6a"/>
            <circle cx="50" cy="42" r="22" fill="#e8b182"/>
            <path d="M28 40 C28 20 72 20 72 40 C68 24 32 24 28 40 Z" fill="#4a2e18"/>
            <rect x="34" y="36" width="12" height="10" rx="3" fill="none" stroke="#222" stroke-width="2"/>
            <rect x="54" y="36" width="12" height="10" rx="3" fill="none" stroke="#222" stroke-width="2"/>
            <line x1="46" y1="41" x2="54" y2="41" stroke="#222" stroke-width="2"/>
            <circle cx="40" cy="41" r="2" fill="#222"/>
            <circle cx="60" cy="41" r="2" fill="#222"/>
            <path d="M38 51 Q50 48 62 51 Q50 56 38 51 Z" fill="#3a2210"/>
            <path d="M44 56 Q50 60 56 56" fill="none" stroke="#683416" stroke-width="1.8" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'wayne',
        name: 'Wayne',
        elo: 400,
        category: 'beginner',
        badge: 'Patient',
        title: 'Beginner',
        quote: "Taking it one move at a time. Don't go too harsh on me!",
        engine: 'stockfish',
        skillLevel: 1,
        depth: 3,
        pace: 1100,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#292e34"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#3a506b"/>
            <path d="M42 64 L50 74 L58 64 Z" fill="#e0e1dd"/>
            <rect x="43" y="52" width="14" height="16" fill="#e0b593"/>
            <circle cx="50" cy="40" r="21" fill="#f0c2a2"/>
            <path d="M29 38 C28 18 72 18 71 38 C67 22 33 22 29 38 Z" fill="#a0a4a8"/>
            <path d="M28 35 Q25 45 28 50 Q31 43 30 35 Z" fill="#a0a4a8"/>
            <path d="M72 35 Q75 45 72 50 Q69 43 70 35 Z" fill="#a0a4a8"/>
            <circle cx="41" cy="39" r="2.2" fill="#2b2d42"/>
            <circle cx="59" cy="39" r="2.2" fill="#2b2d42"/>
            <path d="M37 34 Q41 33 45 35" stroke="#7d8288" stroke-width="2" fill="none"/>
            <path d="M55 35 Q59 33 63 34" stroke="#7d8288" stroke-width="2" fill="none"/>
            <path d="M43 51 Q50 56 57 51" stroke="#8d5b4c" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'fabian',
        name: 'Fabian',
        elo: 650,
        category: 'beginner',
        badge: 'Tricky Tactics',
        title: 'Casual',
        quote: "I like aggressive tricks, but I sometimes forget my king!",
        engine: 'stockfish',
        skillLevel: 2,
        depth: 4,
        pace: 1200,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#2b312b"/>
            <path d="M18 100 L33 65 L67 65 L82 100 Z" fill="#47624f"/>
            <rect x="43" y="52" width="14" height="16" fill="#e5aa70"/>
            <circle cx="50" cy="40" r="20" fill="#f8c291"/>
            <path d="M28 36 L34 20 L42 26 L50 18 L58 25 L66 19 L72 36 Z" fill="#543828"/>
            <circle cx="42" cy="40" r="2.5" fill="#1e272e"/>
            <circle cx="58" cy="40" r="2.5" fill="#1e272e"/>
            <path d="M43 52 Q52 56 58 49" stroke="#9e5638" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'aron',
        name: 'Aron',
        elo: 700,
        category: 'beginner',
        badge: 'Fundamentals',
        title: 'Casual',
        quote: "Practicing the fundamentals: control the center and castle.",
        engine: 'stockfish',
        skillLevel: 3,
        depth: 4,
        pace: 1300,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#322c30"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#843b62"/>
            <path d="M45 64 L50 78 L55 64 Z" fill="#f67280"/>
            <rect x="42" y="51" width="16" height="16" fill="#b87b58"/>
            <circle cx="50" cy="39" r="20" fill="#cfa07e"/>
            <path d="M30 38 C28 20 72 20 70 38 C65 24 35 24 30 38 Z" fill="#201a1e"/>
            <rect x="36" y="35" width="11" height="9" rx="2" fill="none" stroke="#2c3e50" stroke-width="1.8"/>
            <rect x="53" y="35" width="11" height="9" rx="2" fill="none" stroke="#2c3e50" stroke-width="1.8"/>
            <line x1="47" y1="39" x2="53" y2="39" stroke="#2c3e50" stroke-width="1.8"/>
            <circle cx="41.5" cy="39.5" r="2" fill="#201a1e"/>
            <circle cx="58.5" cy="39.5" r="2" fill="#201a1e"/>
            <line x1="44" y1="51" x2="56" y2="51" stroke="#7a422d" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'elena',
        name: 'Elena',
        elo: 900,
        category: 'intermediate',
        badge: 'Solid Defense',
        title: 'Intermediate',
        quote: "Development before attack. Can you break through my defense?",
        engine: 'stockfish',
        skillLevel: 5,
        depth: 5,
        pace: 1400,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#36292b"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#e5a93b"/>
            <path d="M40 64 L50 82 L60 64 Z" fill="#222"/>
            <rect x="43" y="51" width="14" height="16" fill="#df9e76"/>
            <circle cx="50" cy="39" r="19" fill="#f3be98"/>
            <path d="M26 42 C24 16 76 16 74 42 C74 58 70 70 66 76 L62 64 C64 45 64 30 50 25 C36 30 36 45 38 64 L34 76 C30 70 26 58 26 42 Z" fill="#2b1810"/>
            <circle cx="43" cy="38" r="2.2" fill="#1b120c"/>
            <circle cx="57" cy="38" r="2.2" fill="#1b120c"/>
            <path d="M40 35 Q43 33 46 36" stroke="#2b1810" stroke-width="1.5" fill="none"/>
            <path d="M54 36 Q57 33 60 35" stroke="#2b1810" stroke-width="1.5" fill="none"/>
            <path d="M44 50 Q50 55 56 50" stroke="#b04a5a" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'nelson',
        name: 'Nelson',
        elo: 1300,
        category: 'intermediate',
        badge: 'Queen Attacker',
        title: 'Tactical Attacker',
        quote: "Watch out for my Queen! I bring her out early to strike.",
        engine: 'stockfish',
        skillLevel: 8,
        depth: 7,
        pace: 1500,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#242b35"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#2c3e50"/>
            <path d="M40 64 L50 86 L60 64 Z" fill="#ecf0f1"/>
            <polygon points="48,70 52,70 54,88 50,92 46,88" fill="#3498db"/>
            <rect x="42" y="50" width="16" height="16" fill="#d99f77"/>
            <circle cx="50" cy="38" r="20" fill="#f1be9b"/>
            <path d="M28 35 C28 16 72 16 72 35 C68 22 32 22 28 35 Z" fill="#1a1c20"/>
            <path d="M37 32 L46 34" stroke="#1a1c20" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M54 34 L63 32" stroke="#1a1c20" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="42" cy="37" r="2.2" fill="#1a1c20"/>
            <circle cx="58" cy="37" r="2.2" fill="#1a1c20"/>
            <path d="M43 49 Q50 53 58 48" stroke="#804128" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'antonio',
        name: 'Antonio',
        elo: 1500,
        category: 'intermediate',
        badge: 'Club Player',
        title: 'Club Player',
        quote: "Solid, patient, and ready to capitalize on any unforced error.",
        engine: 'stockfish',
        skillLevel: 10,
        depth: 9,
        pace: 1600,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#2d282e"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#232125"/>
            <polygon points="40,64 50,88 60,64" fill="#ffffff"/>
            <rect x="42" y="50" width="16" height="16" fill="#cb956e"/>
            <circle cx="50" cy="38" r="20" fill="#dfad87"/>
            <path d="M33 38 Q33 58 50 60 Q67 58 67 38 Q65 52 50 54 Q35 52 33 38 Z" fill="#231b15"/>
            <path d="M41 47 Q50 45 59 47 Q50 51 41 47 Z" fill="#231b15"/>
            <path d="M28 35 C28 17 72 17 72 35 C68 22 32 22 28 35 Z" fill="#231b15"/>
            <circle cx="42" cy="36" r="2.2" fill="#110d0a"/>
            <circle cx="58" cy="36" r="2.2" fill="#110d0a"/>
            <path d="M44 50 Q50 53 56 50" stroke="#ffffff" stroke-width="1.5" fill="none"/>
        </svg>`
    },
    {
        id: 'isabel',
        name: 'Isabel',
        elo: 1600,
        category: 'intermediate',
        badge: 'Sharp Eye',
        title: 'Tactician',
        quote: "A single miscalculation can lose a piece. Stay focused!",
        engine: 'stockfish',
        skillLevel: 12,
        depth: 10,
        pace: 1600,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#332830"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#4c3549"/>
            <path d="M40 64 L50 82 L60 64 Z" fill="#e9d8a6"/>
            <circle cx="50" cy="74" r="2.5" fill="#ee9b00"/>
            <rect x="43" y="50" width="14" height="16" fill="#e0a37e"/>
            <circle cx="50" cy="38" r="19" fill="#f4be9c"/>
            <path d="M25 40 C23 15 77 15 75 40 C77 62 70 76 65 80 L62 66 C65 42 63 26 50 24 C37 26 35 42 38 66 L35 80 C30 76 23 62 25 40 Z" fill="#1c1619"/>
            <circle cx="43" cy="37" r="2.2" fill="#100b0e"/>
            <circle cx="57" cy="37" r="2.2" fill="#100b0e"/>
            <path d="M40 34 Q43 32 46 34" stroke="#1c1619" stroke-width="1.8" fill="none"/>
            <path d="M54 34 Q57 32 60 34" stroke="#1c1619" stroke-width="1.8" fill="none"/>
            <path d="M44 49 Q50 53 56 49" stroke="#9e2a2b" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'wendy',
        name: 'Wendy',
        elo: 1800,
        category: 'master',
        badge: 'Tournament Expert',
        title: 'Expert',
        quote: "Deep positional maneuvering and sharp endgame technique.",
        engine: 'stockfish',
        skillLevel: 14,
        depth: 11,
        pace: 1600,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#2d3036"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#223043"/>
            <polygon points="41,64 50,84 59,64" fill="#f8f9fa"/>
            <rect x="43" y="50" width="14" height="16" fill="#e7b993"/>
            <circle cx="50" cy="38" r="19" fill="#f7cdad"/>
            <path d="M26 38 C25 18 75 18 74 38 C75 52 70 60 66 62 L63 50 C65 30 63 24 50 24 C37 24 35 30 37 50 L34 62 C30 60 25 52 26 38 Z" fill="#d4a359"/>
            <circle cx="43" cy="38" r="2.2" fill="#223043"/>
            <circle cx="57" cy="38" r="2.2" fill="#223043"/>
            <path d="M44 49 Q50 53 56 49" stroke="#b04a5a" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'li',
        name: 'Li',
        elo: 2000,
        category: 'master',
        badge: 'National Master',
        title: 'Master',
        quote: "Precision in calculation and formidable opening preparation.",
        engine: 'stockfish',
        skillLevel: 16,
        depth: 12,
        pace: 1600,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#252d33"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#1b263b"/>
            <polygon points="42,64 50,86 58,64" fill="#e0e1dd"/>
            <polygon points="48,72 52,72 53,88 50,91 47,88" fill="#415a77"/>
            <rect x="43" y="50" width="14" height="16" fill="#dca986"/>
            <circle cx="50" cy="38" r="19" fill="#f3be9b"/>
            <path d="M28 35 C28 17 72 17 72 35 C68 22 32 22 28 35 Z" fill="#14181c"/>
            <rect x="36" y="34" width="11" height="9" rx="2" fill="none" stroke="#333" stroke-width="1.8"/>
            <rect x="53" y="34" width="11" height="9" rx="2" fill="none" stroke="#333" stroke-width="1.8"/>
            <line x1="47" y1="38" x2="53" y2="38" stroke="#333" stroke-width="1.8"/>
            <circle cx="41.5" cy="38.5" r="2" fill="#14181c"/>
            <circle cx="58.5" cy="38.5" r="2" fill="#14181c"/>
            <path d="M45 49 Q50 52 55 49" stroke="#935740" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'light-yagami',
        name: 'Light Yagami',
        elo: 2400,
        category: 'master',
        badge: 'C++ Engine',
        title: 'Mastermind (Custom C++ Bot)',
        quote: "I will calculate your defeat down to the exact second. Exactly as planned.",
        engine: 'custom',
        skillLevel: 18,
        depth: 4,
        pace: 1600,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#2b1f1f"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#8d734a"/>
            <polygon points="40,64 50,86 60,64" fill="#ffffff"/>
            <polygon points="47,70 53,70 55,89 50,93 45,89" fill="#a81c1c"/>
            <rect x="43" y="49" width="14" height="16" fill="#e2af89"/>
            <circle cx="50" cy="37" r="19" fill="#f5c7a5"/>
            <path d="M26 34 L33 18 L44 16 L54 17 L66 19 L74 34 L66 25 L58 32 L50 25 L42 32 L34 26 Z" fill="#6d4327"/>
            <path d="M30 34 L36 44 L38 34" fill="#6d4327"/>
            <path d="M70 34 L64 44 L62 34" fill="#6d4327"/>
            <path d="M37 34 L45 36" stroke="#991b1b" stroke-width="2" stroke-linecap="round"/>
            <path d="M55 36 L63 34" stroke="#991b1b" stroke-width="2" stroke-linecap="round"/>
            <circle cx="42" cy="38" r="2.2" fill="#b91c1c"/>
            <circle cx="58" cy="38" r="2.2" fill="#b91c1c"/>
            <path d="M44 48 Q50 51 57 47" stroke="#8d3b2a" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'hikaru',
        name: 'Hikaru',
        elo: 2820,
        category: 'gm',
        badge: 'Grandmaster',
        title: 'Super Grandmaster',
        quote: "Takes, takes, takes... and honestly I'm just completely winning here.",
        engine: 'stockfish',
        skillLevel: 19,
        depth: 15,
        pace: 1400,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#25272a"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#181a1b"/>
            <rect x="42" y="49" width="16" height="16" fill="#c48e65"/>
            <circle cx="50" cy="37" r="20" fill="#dcab85"/>
            <path d="M33 38 Q33 58 50 61 Q67 58 67 38 Q65 53 50 55 Q35 53 33 38 Z" fill="#1f1a17"/>
            <path d="M41 46 Q50 44 59 46 Q50 50 41 46 Z" fill="#1f1a17"/>
            <path d="M28 35 C28 17 72 17 72 35 C68 22 32 22 28 35 Z" fill="#1f1a17"/>
            <rect x="35" y="33" width="12" height="10" rx="2" fill="none" stroke="#111" stroke-width="2"/>
            <rect x="53" y="33" width="12" height="10" rx="2" fill="none" stroke="#111" stroke-width="2"/>
            <line x1="47" y1="38" x2="53" y2="38" stroke="#111" stroke-width="2"/>
            <circle cx="41" cy="38" r="2.2" fill="#1f1a17"/>
            <circle cx="59" cy="38" r="2.2" fill="#1f1a17"/>
            <path d="M44 50 Q50 53 56 50" stroke="#ffffff" stroke-width="1.6" fill="none"/>
        </svg>`
    },
    {
        id: 'magnus',
        name: 'Magnus',
        elo: 2882,
        category: 'gm',
        badge: 'World Champ',
        title: 'World Champion',
        quote: "I will grind down any microscopic advantage until victory is inevitable.",
        engine: 'stockfish',
        skillLevel: 20,
        depth: 16,
        pace: 1500,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#24282e"/>
            <path d="M16 100 L32 64 L68 64 L84 100 Z" fill="#1c2536"/>
            <polygon points="41,64 50,86 59,64" fill="#ffffff"/>
            <rect x="42" y="49" width="16" height="16" fill="#dda885"/>
            <circle cx="50" cy="37" r="20" fill="#f1c1a0"/>
            <path d="M28 33 C27 15 73 15 72 33 C68 20 32 20 28 33 Z" fill="#755031"/>
            <path d="M30 28 Q45 16 68 23" stroke="#8d6642" stroke-width="3" fill="none"/>
            <path d="M37 32 L46 34" stroke="#4a311b" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M54 34 L63 32" stroke="#4a311b" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="42" cy="36" r="2.2" fill="#24384a"/>
            <circle cx="58" cy="36" r="2.2" fill="#24384a"/>
            <line x1="43" y1="48" x2="57" y2="48" stroke="#8c4731" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'maximum',
        name: 'Maximum',
        elo: 3200,
        category: 'gm',
        badge: 'Stockfish Max',
        title: 'Maximum Stockfish AI',
        quote: "Grandmaster perfection. Calculates over 20 moves ahead with 0.00% error rate.",
        engine: 'stockfish',
        skillLevel: 20,
        depth: 18,
        pace: 1700,
        avatar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <rect width="100" height="100" fill="#1b1e1b"/>
            <!-- Golden circuit pins -->
            <line x1="28" y1="10" x2="28" y2="24" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="39" y1="10" x2="39" y2="24" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="10" x2="50" y2="24" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="61" y1="10" x2="61" y2="24" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="72" y1="10" x2="72" y2="24" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="28" y1="76" x2="28" y2="90" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="39" y1="76" x2="39" y2="90" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="76" x2="50" y2="90" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="61" y1="76" x2="61" y2="90" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="72" y1="76" x2="72" y2="90" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="10" y1="28" x2="24" y2="28" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="10" y1="39" x2="24" y2="39" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="10" y1="50" x2="24" y2="50" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="10" y1="61" x2="24" y2="61" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="10" y1="72" x2="24" y2="72" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="76" y1="28" x2="90" y2="28" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="76" y1="39" x2="90" y2="39" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="76" y1="50" x2="90" y2="50" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="76" y1="61" x2="90" y2="61" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <line x1="76" y1="72" x2="90" y2="72" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>
            <rect x="22" y="22" width="56" height="56" rx="8" fill="#2d3238" stroke="#505660" stroke-width="2"/>
            <circle cx="32" cy="32" r="3" fill="#81b64c"/>
            <text x="50" y="58" font-family="'Noto Sans', 'Segoe UI', sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">25</text>
        </svg>`
    }
];

// Currently selected bot (default to Maximum 3200 as in screenshot)
var selectedBot = BOTS.find(b => b.id === 'maximum') || BOTS[0];
var currentBotFilter = 'all';

function getBotById(id) {
    return BOTS.find(function(b) { return b.id === id; }) || BOTS[0];
}

function getBotsByCategory(category) {
    if (!category || category === 'all') return BOTS;
    return BOTS.filter(function(b) { return b.category === category; });
}

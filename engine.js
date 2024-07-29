const readline = require('readline');
const { Chess } = require('chess.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const chess = new Chess();
const transpositionTable = new Map();

function uci() {
    console.log("id name VivaEngine");
    console.log("id author Vivaan Kumar");
    console.log("uciok");
    //start it up
}

function isready() {
    console.log("readyok");
}

function ucinewgame() {
    chess.reset();
    transpositionTable.clear();
}

function position(command) {
    //sets up and loads fen and processes the position changes
    const parts = command.split(' ');
    const movesIndex = parts.indexOf('moves');
    if (parts[1] === 'startpos') {
        chess.reset();
        if (movesIndex !== -1) {
            const moves = parts.slice(movesIndex + 1);
            for (let move of moves) {
                chess.move(move, { sloppy: true });
            }
        }
    } else if (parts[1] === 'fen') {
        const fen = parts.slice(2, movesIndex).join(' ');
        chess.load(fen);
        if (movesIndex !== -1) {
            const moves = parts.slice(movesIndex + 1);
            for (let move of moves) {
                chess.move(move, { sloppy: true });
            }
        }
    }
}

function evaluateBoard(board) {
    //these values are similar to Crafty chesss engine written in C language, they were public piece values and thus decided to use them.
    const pieceValues = {
        p: 100,
        b: 330,
        n: 320,
        r: 500,
        q: 1050,
        k: 40000
    };

    // this is kindve like a heat map for each piece which shows us where the piece piece has the highest value I couldnt find any online to use so i had to make them myself so proabbly highliy inaccurate
    const positionValues = {
        //best for promotion
        p: [
            [40, 50, 50, 50, 50, 50, 50, 40],
            [0, 10, -5, 0, 5, 10, 50, 0],
            [0, 10, -10, 0, 10, 20, 50, 0],
            [0, -20, 0, 20, 30, 30, 50, 0],
            [0, -20, 0, 20, 25, 30, 50, 0],
            [0, 10, -10, 0, 10, 20, 50, 0],
            [0, 10, -5, 0, 5, 10, 50, 0],
            [40, 50, 50, 50, 50, 50, 50, 40],
        ],

        //best cnter of the board
        n: [
            [-50, -40, -30, -30, -30, -30, -40, -50],
            [-40, -20, 0, 5, 5, 0, -20, -40],
            [-30, 5, 10, 15, 15, 10, 5, -30],
            [-30, 0, 15, 20, 20, 15, 0, -30],
            [-30, 5, 15, 20, 25, 15, 5, -30],
            [-30, 0, 10, 15, 15, 10, 0, -30],
            [-40, -20, 0, 0, 0, 0, -20, -40],
            [-50, -40, -30, -30, -30, -30, -40, -50]
        ],
        //
        //not that direct but best at middle
        b: [
            [-20, -10, -10, -10, -10, -10, -10, -20],
            [-10, 5, 0, 0, 0, 0, 5, -10],
            [-10, 10, 10, 10, 10, 10, 10, -10],
            [-10, 0, 10, 20, 20, 10, 0, -10],
            [-10, 5, 5, 20, 20, 5, 5, -10],
            [-10, 0, 5, 10, 10, 5, 0, -10],
            [-10, 0, 0, 0, 0, 0, 0, -10],
            [-20, -10, -10, -10, -10, -10, -10, -20]
        ],

        //always best on the second rank baby
        r: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [5, 10, 10, 10, 10, 10, 10, 5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [-5, 0, 0, 0, 0, 0, 0, -5],
            [5, 10, 10, 10, 10, 10, 10, 5],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],

        //best middleish back
        q: [
            [-20, -10, -10, -5, -5, -10, -10, -20],
            [-10, 0, 0, 0, 0, 0, 0, -10],
            [-10, 0, 5, 10, 10, 5, 0, -10],
            [-5, 0, 5, 5, 5, 5, 0, -5],
            [0, 0, 5, 5, 5, 5, 0, -5],
            [-10, 5, 5, 5, 5, 5, 0, -10],
            [-10, 0, 5, 10, 10, 0, 0, -10],
            [-20, -10, -10, -5, -5, -10, -10, -20]
        ],

        //best at its own 2 ranks
        k: [
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-30, -40, -40, -50, -50, -40, -40, -30],
            [-20, -30, -30, -40, -40, -30, -30, -20],
            [-10, -20, -20, -20, -20, -20, -20, -10],
            [20, 20, 0, 0, 0, 0, 20, 20],
            [20, 30, 10, 0, 0, 10, 30, 20]
        ]
    };

    let evaluation = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const value = pieceValues[piece.type];

                const positionValue = piece.color === 'w' ? positionValues[piece.type][row][col] : -positionValues[piece.type][7 - row][col];


                evaluation += piece.color === 'w' ? value + positionValue : -value + positionValue;
            }
        }
    }

    return evaluation;
}

//evaluation, if white is turn it wants to max score, if blacks turn it wants to minimize score (maybe into negatives too)

function minimax(depth, maximizingPlayer, alpha, beta) {
    const hash = chess.fen();
    if (transpositionTable.has(hash)) {
        return transpositionTable.get(hash);
    }

    //if the maxismum depth or game is over has been reached stop evaluating
    if (depth === 0 || chess.isGameOver()) {
        return quinSearch(alpha, beta);
    }

    //get the move list
    const moves = chess.moves({ verbose: true });
    moves.sort((a, b) => {
        // this involves captures and promotions to be have morre points

        //capture priority
        if (a.captured && !b.captured) return -1;
        if (!a.captured && b.captured) return 1;

        //promotion to queen priority
        if (a.flags.includes('p') && !b.flags.includes('p')) return -1;
        if (!a.flags.includes('p') && b.flags.includes('p')) return 1;
        return 0;
    });

    if (maximizingPlayer) {
        //for white, try to max eval score 
        let maxEval = -Infinity;
        for (let move of moves) {
            //do the mvoe
            chess.move(move.san);
            //recursive function calls the function again with 1 lower depth 
            const eval = minimax(depth - 1, false, alpha, beta);

            //undo the move so we are back to the original board 
            chess.undo();
            //update eval score
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);


            //using alpha beta pruning we cut off useless branch if beta is less than or rqual to alpha
            if (beta <= alpha) {
                break;
            }
        }
        transpositionTable.set(hash, maxEval);
        return maxEval;
    } else {
        // tthis is for black , we need to try minimizing player

        //samething as for black but reverse
        let minEval = Infinity;
        for (let move of moves) {
            chess.move(move.san);

            const eval = minimax(depth - 1, true, alpha, beta);
            chess.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);

            if (beta <= alpha) {
                break;
            }
        }
        transpositionTable.set(hash, minEval);
        return minEval;
    }
}

//basically stopping after certain depth is dangerous as maybe depth + 1 might have a crucial move, so we need to account for 'quiet' positiond

function quinSearch(alpha, beta) {
    const shush = evaluateBoard(chess.board());
    if (shush >= beta) {
        return beta;
    }
    if (alpha < shush) {
        alpha = shush;
    }

    const moves = chess.moves({ verbose: true }).filter(move => move.captured);
    for (let move of moves) {
        chess.move(move.san);

        //
        const score = -quinSearch(-beta, -alpha);
        chess.undo();

        if (score >= beta) {
            return beta;
        }
        if (score > alpha) {
            alpha = score;
        }
    }
    return alpha;
}

function goDeeper(maxDepth) {
    let bestMove = null;
    for (let depth = 1; depth <= maxDepth; depth++) {
        bestMove = searchBestMove(depth);
    }
    return bestMove;
}

function searchBestMove(depth) {
    const moves = chess.moves();
    let bestEval = -Infinity;
    let bestMove = null;


    for (let move of moves) {
        chess.move(move);
        const eval = minimax(depth - 1, false, -Infinity, Infinity);
        chess.undo();
        if (eval > bestEval) {
            bestEval = eval;
            bestMove = move;
        }
    }
    return bestMove;
}

function bestMove() {
    //just calls the minmax and finds out the best move
    const maxDepth = 12; // maximum depth of search
    const bestMove = goDeeper(maxDepth);
    console.log(`bestmove ${bestMove}`);
}

rl.on('line', (input) => {
    const command = input.trim();
    if (command === 'uci') {
        uci();
    } else if (command === 'isready') {
        isready();
    } else if (command === 'ucinewgame') {
        ucinewgame();
    } else if (command.startsWith('position')) {
        position(command);
    } else if (command.startsWith('go')) {
        bestMove();
    } else if (command.startsWith('move')) {
        const move = command.split(' ')[1];
        chess.move(move, { sloppy: true });
        bestMove();
    } else if (command === 'quit') {
        rl.close();
        //close em up
    }
});

console.log("VivaEngine: Project for hackathon InnovateX 2024");
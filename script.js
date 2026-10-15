const BOARD_SIZE = 8;
let board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('block_blast_high') || 0;
let currentPieces = [null, null, null];
let selectedIndex = null;

const shapes = [
    [[1]], // 1x1
    [[1, 1]], // 1x2
    [[1], [1]], // 2x1
    [[1, 1], [1, 1]], // 2x2 box
    [[1, 1, 1]], // 1x3
    [[1], [1], [1]], // 3x1
    [[1, 1, 1], [0, 1, 0]], // T shape small
    [[1, 1], [1, 0]], // L small
];

document.getElementById('high-score').innerText = highScore;

const boardEl = document.getElementById('board');
const trayEl = document.getElementById('tray');

function initBoardDOM() {
    boardEl.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            boardEl.appendChild(cell);
        }
    }
}

function renderBoard() {
    const cells = boardEl.children;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const idx = r * BOARD_SIZE + c;
            if (board[r][c] === 1) {
                cells[idx].classList.add('filled');
            } else {
                cells[idx].classList.remove('filled');
            }
        }
    }
}

function getRandomShape() {
    return shapes[Math.floor(Math.random() * shapes.length)];
}

function generateTrayPieces() {
    for (let i = 0; i < 3; i++) {
        currentPieces[i] = getRandomShape();
    }
    renderTray();
    checkGameOver();
}

function renderTray() {
    trayEl.innerHTML = '';
    currentPieces.forEach((piece, index) => {
        const container = document.createElement('div');
        container.classList.add('piece-container');
        
        if (piece) {
            const rows = piece.length;
            const cols = piece[0].length;
            const miniGrid = document.createElement('div');
            miniGrid.classList.add('mini-grid');
            miniGrid.style.gridTemplateColumns = `repeat(${cols}, 14px)`;
            miniGrid.style.gridTemplateRows = `repeat(${rows}, 14px)`;

            piece.forEach(row => {
                row.forEach(val => {
                    const mCell = document.createElement('div');
                    mCell.classList.add('mini-cell');
                    if (val === 0) mCell.classList.add('empty');
                    miniGrid.appendChild(mCell);
                });
            });
            container.appendChild(miniGrid);
            container.onclick = () => selectPiece(index);
        }
        trayEl.appendChild(container);
    });
}

function selectPiece(index) {
    if (!currentPieces[index]) return;
    selectedIndex = index;
    alert("Balok dipilih! Silakan klik kotak di papan 8x8 untuk menaruhnya.");
}

boardEl.onclick = (e) => {
    if (selectedIndex === null || !currentPieces[selectedIndex]) return;
    const target = e.target;
    if (!target.classList.contains('cell')) return;

    const r = parseInt(target.dataset.row);
    const c = parseInt(target.dataset.col);
    const piece = currentPieces[selectedIndex];

    if (canPlace(piece, r, c)) {
        placePiece(piece, r, c);
        currentPieces[selectedIndex] = null;
        selectedIndex = null;
        renderBoard();
        renderTray();
        checkClear();
        
        if (currentPieces.every(p => p === null)) {
            generateTrayPieces();
        } else {
            checkGameOver();
        }
    } else {
        alert("Tidak muat di posisi tersebut!");
        selectedIndex = null;
    }
};

function canPlace(piece, startR, startC) {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c] === 1) {
                let targetR = startR + r;
                let targetC = startC + c;
                if (targetR >= BOARD_SIZE || targetC >= BOARD_SIZE) return false;
                if (board[targetR][targetC] === 1) return false;
            }
        }
    }
    return true;
}

function placePiece(piece, startR, startC) {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c] === 1) {
                board[startR + r][startC + c] = 1;
                score += 10;
            }
        }
    }
    updateScore();
}

function checkClear() {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
        if (board[r].every(cell => cell === 1)) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
        let colFull = true;
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (board[r][c] === 0) colFull = false;
        }
        if (colFull) colsToClear.push(c);
    }

    rowsToClear.forEach(r => {
        for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = 0;
        score += 100;
    });
    colsToClear.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) board[r][c] = 0;
        score += 100;
    });

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
        updateScore();
        renderBoard();
    }
}

function checkGameOver() {
    let activePieces = currentPieces.filter(p => p !== null);
    if (activePieces.length === 0) return;

    let possible = false;
    activePieces.forEach(piece => {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (canPlace(piece, r, c)) possible = true;
            }
        }
    });

    if (!possible) {
        document.getElementById('game-over').style.display = 'flex';
    }
}

function updateScore() {
    document.getElementById('score').innerText = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('block_blast_high', highScore);
        document.getElementById('high-score').innerText = highScore;
    }
}

function resetGame() {
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    score = 0;
    updateScore();
    document.getElementById('game-over').style.display = 'none';
    initBoardDOM();
    generateTrayPieces();
}

// Inisialisasi awal game
initBoardDOM();
generateTrayPieces();

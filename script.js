const BOARD_SIZE = 8;
let board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('block_blast_high') || 0;
let currentPieces = [null, null, null];

let activeDrag = {
    index: null,
    element: null,
    offsetX: 0,
    offsetY: 0,
    piece: null
};

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
            
            container.addEventListener('pointerdown', (e) => startDrag(e, index, container));
        }
        trayEl.appendChild(container);
    });
}

function startDrag(e, index, container) {
    if (!currentPieces[index]) return;
    e.preventDefault();

    activeDrag.index = index;
    activeDrag.piece = currentPieces[index];
    
    const clone = container.cloneNode(true);
    clone.classList.add('dragging-piece');
    document.body.appendChild(clone);
    activeDrag.element = clone;

    const rect = container.getBoundingClientRect();
    activeDrag.offsetX = e.clientX - rect.left;
    activeDrag.offsetY = e.clientY - rect.top;

    moveClone(e.clientX, e.clientY);
    container.style.opacity = '0.3';

    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
}

function onDragMove(e) {
    if (!activeDrag.element) return;
    moveClone(e.clientX, e.clientY);
}

function moveClone(x, y) {
    activeDrag.element.style.left = `${x - activeDrag.offsetX}px`;
    activeDrag.element.style.top = `${y - activeDrag.offsetY}px`;
}

function onDragEnd(e) {
    if (!activeDrag.element) return;

    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);

    const boardRect = boardEl.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
        x >= boardRect.left &&
        x <= boardRect.right &&
        y >= boardRect.top &&
        y <= boardRect.bottom
    ) {
        const cellEls = boardEl.children;
        let targetCell = null;

        for (let cell of cellEls) {
            const r = cell.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                targetCell = cell;
                break;
            }
        }

        if (targetCell) {
            const startR = parseInt(targetCell.dataset.row);
            const startC = parseInt(targetCell.dataset.col);
            const piece = activeDrag.piece;

            if (canPlace(piece, startR, startC)) {
                placePiece(piece, startR, startC);
                currentPieces[activeDrag.index] = null;
                renderBoard();
                checkClear();

                if (currentPieces.every(p => p === null)) {
                    generateTrayPieces();
                } else {
                    checkGameOver();
                }
            }
        }
    }

    activeDrag.element.remove();
    activeDrag.element = null;
    activeDrag.index = null;
    activeDrag.piece = null;
    renderTray();
}

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

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
        const cells = boardEl.children;
        let cellsToAnimate = new Set();

        rowsToClear.forEach(r => {
            for (let c = 0; c < BOARD_SIZE; c++) {
                cellsToAnimate.add(r * BOARD_SIZE + c);
            }
        });

        colsToClear.forEach(c => {
            for (let r = 0; r < BOARD_SIZE; r++) {
                cellsToAnimate.add(r * BOARD_SIZE + c);
            }
        });

        cellsToAnimate.forEach(idx => {
            cells[idx].classList.add('clearing');
        });

        setTimeout(() => {
            rowsToClear.forEach(r => {
                for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = 0;
                score += 100;
            });

            colsToClear.forEach(c => {
                for (let r = 0; r < BOARD_SIZE; r++) board[r][c] = 0;
                score += 100;
            });

            cellsToAnimate.forEach(idx => {
                cells[idx].classList.remove('clearing');
            });

            updateScore();
            renderBoard();
            checkGameOver();
        }, 350);
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

initBoardDOM();
generateTrayPieces();
                  

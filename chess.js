const GLYPHS = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

const PIECE_VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const turnIndicatorEl = document.getElementById("turn-indicator");
const resetBtn = document.getElementById("reset");
const whiteCapturedEl = document.getElementById("white-captured");
const blackCapturedEl = document.getElementById("black-captured");
const whiteAdvantageEl = document.getElementById("white-advantage");
const blackAdvantageEl = document.getElementById("black-advantage");
const whiteWinsEl = document.getElementById("white-wins");
const blackWinsEl = document.getElementById("black-wins");
const moveCountEl = document.getElementById("move-count");

let board;
let turn;
let selected;
let moves;
let gameOver;
let animating;
let moveCount;
let capturedByWhite;
let capturedByBlack;
let matchWins;
let prevWhiteCaptured;
let prevBlackCaptured;

function initialBoard() {
  const back = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    b[0][c] = "b" + back[c];
    b[1][c] = "bP";
    b[6][c] = "wP";
    b[7][c] = "w" + back[c];
  }
  return b;
}

function newGame() {
  board = initialBoard();
  turn = "w";
  selected = null;
  moves = [];
  gameOver = false;
  animating = false;
  moveCount = 0;
  capturedByWhite = [];
  capturedByBlack = [];
  prevWhiteCaptured = 0;
  prevBlackCaptured = 0;
  updateStatus();
  render(true);
  updateScorePanel();
}

function updateStatus(winner) {
  if (winner) {
    statusEl.textContent = (winner === "w" ? "White" : "Black") + " wins!";
    turnIndicatorEl.className = "turn-indicator turn-" + (winner === "w" ? "white" : "black");
    return;
  }
  statusEl.textContent = (turn === "w" ? "White" : "Black") + " to move";
  turnIndicatorEl.className = "turn-indicator turn-" + (turn === "w" ? "white" : "black");
}

function materialValue(pieces) {
  return pieces.reduce((sum, p) => sum + PIECE_VALUE[p[1]], 0);
}

function updateScorePanel() {
  whiteCapturedEl.innerHTML = capturedByWhite
    .map((p, i) =>
      `<span class="captured-piece black${i >= prevWhiteCaptured ? " is-new" : ""}">${GLYPHS[p]}</span>`
    )
    .join("");
  blackCapturedEl.innerHTML = capturedByBlack
    .map((p, i) =>
      `<span class="captured-piece white${i >= prevBlackCaptured ? " is-new" : ""}">${GLYPHS[p]}</span>`
    )
    .join("");
  prevWhiteCaptured = capturedByWhite.length;
  prevBlackCaptured = capturedByBlack.length;

  const whiteMat = materialValue(capturedByWhite);
  const blackMat = materialValue(capturedByBlack);
  const diff = whiteMat - blackMat;

  whiteAdvantageEl.textContent = diff > 0 ? `+${diff}` : "";
  blackAdvantageEl.textContent = diff < 0 ? `+${-diff}` : "";

  whiteWinsEl.textContent = matchWins.w;
  blackWinsEl.textContent = matchWins.b;
  moveCountEl.textContent = moveCount;
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function ray(r, c, dr, dc, color, out) {
  let nr = r + dr, nc = c + dc;
  while (inBounds(nr, nc)) {
    const target = board[nr][nc];
    if (!target) {
      out.push({ row: nr, col: nc });
    } else {
      if (target[0] !== color) out.push({ row: nr, col: nc });
      break;
    }
    nr += dr;
    nc += dc;
  }
}

function legalMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const out = [];

  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    if (inBounds(row + dir, col) && !board[row + dir][col]) {
      out.push({ row: row + dir, col });
      if (row === startRow && !board[row + 2 * dir][col]) {
        out.push({ row: row + 2 * dir, col });
      }
    }
    for (const dc of [-1, 1]) {
      const nr = row + dir, nc = col + dc;
      if (inBounds(nr, nc) && board[nr][nc] && board[nr][nc][0] !== color) {
        out.push({ row: nr, col: nc });
      }
    }
  } else if (type === "N") {
    for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      const nr = row + dr, nc = col + dc;
      if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc][0] !== color)) {
        out.push({ row: nr, col: nc });
      }
    }
  } else if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc][0] !== color)) {
          out.push({ row: nr, col: nc });
        }
      }
    }
  } else {
    const dirs = [];
    if (type === "R" || type === "Q") dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    if (type === "B" || type === "Q") dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    for (const [dr, dc] of dirs) ray(row, col, dr, dc, color, out);
  }
  return out;
}

function applyMove(from, to) {
  const piece = board[from.row][from.col];
  const captured = board[to.row][to.col];
  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;

  if (piece[1] === "P" && (to.row === 0 || to.row === 7)) {
    board[to.row][to.col] = piece[0] + "Q";
  }

  if (captured) {
    if (turn === "w") capturedByWhite.push(captured);
    else capturedByBlack.push(captured);
  }

  moveCount++;

  let winner = null;
  if (captured && captured[1] === "K") {
    gameOver = true;
    winner = turn;
    matchWins[winner]++;
  } else {
    turn = turn === "w" ? "b" : "w";
  }

  return { captured, winner };
}

function getSquare(row, col) {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animateMove(from, to) {
  const fromSq = getSquare(from.row, from.col);
  const toSq = getSquare(to.row, to.col);
  if (!fromSq || !toSq) return;

  const pieceEl = fromSq.querySelector(".piece");
  if (!pieceEl) return;

  const capturedEl = toSq.querySelector(".piece");
  if (capturedEl) capturedEl.classList.add("captured");

  const dx = toSq.offsetLeft - fromSq.offsetLeft;
  const dy = toSq.offsetTop - fromSq.offsetTop;

  pieceEl.classList.add("moving");
  pieceEl.style.transform = `translate(${dx}px, ${dy}px)`;

  await wait(380);
}

function render(entrance = false) {
  boardEl.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      sq.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
      sq.dataset.row = r;
      sq.dataset.col = c;

      const piece = board[r][c];
      if (piece) {
        const span = document.createElement("span");
        span.className = "piece " + (piece[0] === "w" ? "white" : "black");
        span.textContent = GLYPHS[piece];
        if (entrance) {
          span.classList.add("enter");
          span.style.animationDelay = `${(r + c) * 25}ms`;
        }
        if (selected && selected.row === r && selected.col === c) {
          span.classList.add("lifted");
        }
        sq.appendChild(span);
      }

      if (selected && selected.row === r && selected.col === c) {
        sq.classList.add("selected");
      }
      if (moves.some((m) => m.row === r && m.col === c)) {
        sq.classList.add(piece ? "capture" : "move");
      }

      boardEl.appendChild(sq);
    }
  }
}

boardEl.addEventListener("click", (e) => {
  const sq = e.target.closest(".square");
  if (!sq) return;
  onSquareClick(Number(sq.dataset.row), Number(sq.dataset.col));
});

async function onSquareClick(row, col) {
  if (gameOver || animating) return;

  if (selected && moves.some((m) => m.row === row && m.col === col)) {
    animating = true;
    const from = selected;
    const to = { row, col };

    await animateMove(from, to);

    const { winner } = applyMove(from, to);
    selected = null;
    moves = [];

    if (winner) updateStatus(winner);
    else updateStatus();

    render();
    updateScorePanel();
    animating = false;
    return;
  }

  const piece = board[row][col];
  if (piece && piece[0] === turn) {
    selected = { row, col };
    moves = legalMoves(row, col);
  } else {
    selected = null;
    moves = [];
  }
  render();
}

matchWins = { w: 0, b: 0 };
resetBtn.addEventListener("click", newGame);

newGame();

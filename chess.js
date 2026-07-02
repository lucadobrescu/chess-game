const GLYPHS = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset");

let board;      // 8x8 array of piece codes ("wP", "bK", ...) or null
let turn;       // "w" or "b"
let selected;   // {row, col} or null
let moves;      // legal targets for the selected piece
let gameOver;

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
  statusEl.textContent = "White to move";
  render();
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Moves along a direction until blocked (rook/bishop/queen).
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

function makeMove(from, to) {
  const piece = board[from.row][from.col];
  const captured = board[to.row][to.col];
  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;

  // Pawn promotion (auto-queen)
  if (piece[1] === "P" && (to.row === 0 || to.row === 7)) {
    board[to.row][to.col] = piece[0] + "Q";
  }

  if (captured && captured[1] === "K") {
    gameOver = true;
    statusEl.textContent = (turn === "w" ? "White" : "Black") + " wins!";
  } else {
    turn = turn === "w" ? "b" : "w";
    statusEl.textContent = (turn === "w" ? "White" : "Black") + " to move";
  }
}

function render() {
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

function onSquareClick(row, col) {
  if (gameOver) return;

  if (selected && moves.some((m) => m.row === row && m.col === col)) {
    makeMove(selected, { row, col });
    selected = null;
    moves = [];
    render();
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

resetBtn.addEventListener("click", newGame);

newGame();

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
  gameOver = false;
  render();
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
  const piece = board[row][col];
  if (piece && piece[0] === turn) {
    selected = { row, col };
  } else {
    selected = null;
  }
  render();
}

resetBtn.addEventListener("click", newGame);

newGame();

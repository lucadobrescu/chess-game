const PIECE_SKINS = {
  classic: {
    wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
    bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
  },
  alpha: {
    wK: "K", wQ: "Q", wR: "R", wB: "B", wN: "N", wP: "P",
    bK: "K", bQ: "Q", bR: "R", bB: "B", bN: "N", bP: "P",
  },
  bold: {
    wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
    bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
  },
  ivory: {
    wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
    bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
  },
};

const SKIN_DEFAULTS = {
  piece: "classic",
  board: "terracotta",
  bg: "imperium",
};

const BOARD_SKINS = ["terracotta", "walnut", "slate", "emerald"];
const BG_SKINS = ["imperium", "midnight", "forest", "obsidian"];

const SKIN_STORAGE_KEY = "chess-skins";

let activeSkins = { ...SKIN_DEFAULTS };

function getGlyph(piece) {
  return PIECE_SKINS[activeSkins.piece][piece];
}

function loadSkins() {
  try {
    const saved = JSON.parse(localStorage.getItem(SKIN_STORAGE_KEY));
    if (saved) {
      if (saved.piece && PIECE_SKINS[saved.piece]) activeSkins.piece = saved.piece;
      if (saved.board && BOARD_SKINS.includes(saved.board)) activeSkins.board = saved.board;
      if (saved.bg && BG_SKINS.includes(saved.bg)) activeSkins.bg = saved.bg;
    }
  } catch {
    /* use defaults */
  }
}

function saveSkins() {
  localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(activeSkins));
}

function applySkins() {
  const root = document.documentElement;
  root.dataset.pieceSkin = activeSkins.piece;
  root.dataset.boardSkin = activeSkins.board;
  root.dataset.bgSkin = activeSkins.bg;

  const pieceSelect = document.getElementById("piece-skin");
  const boardSelect = document.getElementById("board-skin");
  const bgSelect = document.getElementById("bg-skin");
  if (pieceSelect) pieceSelect.value = activeSkins.piece;
  if (boardSelect) boardSelect.value = activeSkins.board;
  if (bgSelect) bgSelect.value = activeSkins.bg;
}

function initSkinPicker() {
  loadSkins();
  applySkins();

  document.getElementById("piece-skin").addEventListener("change", (e) => {
    activeSkins.piece = e.target.value;
    saveSkins();
    applySkins();
    render();
    updateScorePanel();
  });

  document.getElementById("board-skin").addEventListener("change", (e) => {
    activeSkins.board = e.target.value;
    saveSkins();
    applySkins();
  });

  document.getElementById("bg-skin").addEventListener("change", (e) => {
    activeSkins.bg = e.target.value;
    saveSkins();
    applySkins();
  });
}

const PIECE_VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const turnIndicatorEl = document.getElementById("turn-indicator");
const resetBtn = document.getElementById("reset");
const whiteCapturedEl = document.getElementById("white-captured");
const blackCapturedEl = document.getElementById("black-captured");
const whitePointsEl = document.getElementById("white-points");
const blackPointsEl = document.getElementById("black-points");
const whiteCaptureCountEl = document.getElementById("white-capture-count");
const blackCaptureCountEl = document.getElementById("black-capture-count");
const whiteWinsEl = document.getElementById("white-wins");
const blackWinsEl = document.getElementById("black-wins");
const moveCountEl = document.getElementById("move-count");
const moveHistoryListEl = document.getElementById("move-history-list");
const moveLessonEl = document.getElementById("move-lesson");
const lessonTextEl = document.getElementById("lesson-text");

const FILES = "abcdefgh";
const PIECE_NAMES = {
  P: "Pawn", N: "Knight", B: "Bishop", R: "Rook", Q: "Queen", K: "King",
};

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
let moveHistory;
let selectedHistoryIndex;

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
  moveHistory = [];
  selectedHistoryIndex = -1;
  updateStatus();
  render(true);
  updateScorePanel();
  updateMoveHistory();
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
      `<span class="captured-piece black${i >= prevWhiteCaptured ? " is-new" : ""}">${getGlyph(p)}</span>`
    )
    .join("");
  blackCapturedEl.innerHTML = capturedByBlack
    .map((p, i) =>
      `<span class="captured-piece white${i >= prevBlackCaptured ? " is-new" : ""}">${getGlyph(p)}</span>`
    )
    .join("");
  prevWhiteCaptured = capturedByWhite.length;
  prevBlackCaptured = capturedByBlack.length;

  const whiteMat = materialValue(capturedByWhite);
  const blackMat = materialValue(capturedByBlack);

  whitePointsEl.textContent = whiteMat;
  blackPointsEl.textContent = blackMat;
  whitePointsEl.classList.toggle("is-leading", whiteMat > blackMat);
  blackPointsEl.classList.toggle("is-leading", blackMat > whiteMat);

  whiteCaptureCountEl.textContent = capturedByWhite.length;
  blackCaptureCountEl.textContent = capturedByBlack.length;

  whiteWinsEl.textContent = matchWins.w;
  blackWinsEl.textContent = matchWins.b;
  whiteWinsEl.classList.toggle("is-leading", matchWins.w > matchWins.b);
  blackWinsEl.classList.toggle("is-leading", matchWins.b > matchWins.w);

  moveCountEl.textContent = moveCount;
}

function squareName(row, col) {
  return FILES[col] + (8 - row);
}

function formatNotation(from, to, piece, captured) {
  const type = piece[1];
  const toSq = squareName(to.row, to.col);

  if (type === "P") {
    let notation = captured ? FILES[from.col] + "x" + toSq : toSq;
    if (to.row === 0 || to.row === 7) notation += "=Q";
    return notation;
  }

  return type + (captured ? "x" : "") + toSq;
}

function buildMoveRecord(from, to, piece, captured, color) {
  const type = piece[1];
  const fromSq = squareName(from.row, from.col);
  const toSq = squareName(to.row, to.col);
  const notation = formatNotation(from, to, piece, captured);

  let tip;
  if (type === "P") {
    if (captured) {
      tip = "Pawn capture: write the file letter, x, then the destination (e.g. exd5).";
    } else if (Math.abs(to.row - from.row) === 2) {
      tip = "A pawn's first move may jump two squares; only the destination square is notated.";
    } else if (to.row === 0 || to.row === 7) {
      tip = "Promotion — when a pawn reaches the far rank it becomes a Queen (=Q).";
    } else {
      tip = "Pawn moves use only the destination square (e.g. e4, d5).";
    }
  } else if (captured) {
    tip = `${PIECE_NAMES[type]} capture: piece letter + x + square (e.g. Bxe5).`;
  } else {
    tip = `${PIECE_NAMES[type]} move: piece letter + destination square (e.g. Nf3, Qd1).`;
  }

  return {
    color,
    notation,
    from: fromSq,
    to: toSq,
    piece: type,
    pieceName: PIECE_NAMES[type],
    captured: captured ? PIECE_NAMES[captured[1]] : null,
    tip,
  };
}

function showLesson(record, index) {
  selectedHistoryIndex = index;
  moveLessonEl.hidden = false;
  const side = record.color === "w" ? "White" : "Black";
  lessonTextEl.innerHTML =
    `<strong>${side}: ${record.notation}</strong>` +
    `<span class="lesson-detail">${record.from} → ${record.to}</span>` +
    (record.captured
      ? `<span class="lesson-capture">Takes ${record.captured}</span>`
      : "") +
    `<em>${record.tip}</em>`;
  updateMoveHistoryHighlight();
}

function updateMoveHistoryHighlight() {
  moveHistoryListEl.querySelectorAll(".history-move").forEach((btn) => {
    btn.classList.toggle("is-selected", Number(btn.dataset.index) === selectedHistoryIndex);
  });
}

function updateMoveHistory(latestRecord) {
  if (moveHistory.length === 0) {
    moveHistoryListEl.innerHTML =
      '<p class="history-empty">No moves yet — play a pawn or piece to begin.</p>';
    moveLessonEl.hidden = true;
    return;
  }

  let html = "";
  for (let i = 0; i < moveHistory.length; i += 2) {
    const num = i / 2 + 1;
    const white = moveHistory[i];
    const black = moveHistory[i + 1];

    html += `<div class="history-row">`;
    html += `<span class="history-num">${num}.</span>`;
    html += `<button type="button" class="history-move history-move--white" data-index="${i}">${white.notation}</button>`;
    html += black
      ? `<button type="button" class="history-move history-move--black" data-index="${i + 1}">${black.notation}</button>`
      : `<span class="history-move history-move--pending"></span>`;
    html += `</div>`;
  }

  moveHistoryListEl.innerHTML = html;

  if (latestRecord) {
    showLesson(latestRecord, moveHistory.length - 1);
  }

  moveHistoryListEl.scrollTop = moveHistoryListEl.scrollHeight;
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
        span.textContent = getGlyph(piece);
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
    const piece = board[from.row][from.col];
    const captured = board[to.row][to.col];

    await animateMove(from, to);

    const record = buildMoveRecord(from, to, piece, captured, turn);
    moveHistory.push(record);

    const { winner } = applyMove(from, to);
    selected = null;
    moves = [];

    if (winner) updateStatus(winner);
    else updateStatus();

    render();
    updateScorePanel();
    updateMoveHistory(record);
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

moveHistoryListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".history-move[data-index]");
  if (!btn) return;
  const index = Number(btn.dataset.index);
  showLesson(moveHistory[index], index);
});

initSkinPicker();
newGame();

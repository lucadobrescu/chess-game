window.ArcadeGames = window.ArcadeGames || {};

(function () {
  const VARIANT_STORAGE_KEY = "chess-variant";
  const PIECE_VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
  const FILES = "abcdefgh";
  const PIECE_NAMES = {
    P: "Pawn", N: "Knight", B: "Bishop", R: "Rook", Q: "Queen", K: "King",
  };

  let mountEl;
  let boardEl;
  let statusEl;
  let turnIndicatorEl;
  let variantBarEl;

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
  let activeVariant;

  let whiteCapturedEl;
  let blackCapturedEl;
  let whitePointsEl;
  let blackPointsEl;
  let whiteCaptureCountEl;
  let blackCaptureCountEl;
  let whiteWinsEl;
  let blackWinsEl;
  let moveCountEl;
  let moveHistoryListEl;
  let moveLessonEl;
  let lessonTextEl;

  let boardClickHandler;
  let historyClickHandler;
  let unbindSkinChange;
  let variantClickHandler;

  function getGlyph(piece) {
    return window.ArcadeShell.getGlyph(piece);
  }

  function loadVariant() {
    try {
      const saved = localStorage.getItem(VARIANT_STORAGE_KEY);
      if (saved === "freestyle" || saved === "standard") return saved;
    } catch {
      /* use default */
    }
    return "standard";
  }

  function saveVariant() {
    localStorage.setItem(VARIANT_STORAGE_KEY, activeVariant);
  }

  function isLightSquare(row, col) {
    return (row + col) % 2 === 0;
  }

  function generateBackRank(row) {
    const queenOnLight = row === 7;
    const slots = Array(8).fill(null);
    const empty = () => [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => slots[i] === null);

    const lightCols = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => isLightSquare(row, c));
    const darkCols = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => !isLightSquare(row, c));

    const availLight = lightCols.filter((c) => slots[c] === null);
    const availDark = darkCols.filter((c) => slots[c] === null);
    slots[availLight[Math.floor(Math.random() * availLight.length)]] = "B";
    slots[availDark[Math.floor(Math.random() * availDark.length)]] = "B";

    const queenEligible = empty().filter((c) =>
      queenOnLight ? isLightSquare(row, c) : !isLightSquare(row, c)
    );
    slots[queenEligible[Math.floor(Math.random() * queenEligible.length)]] = "Q";

    let rem = empty();
    slots[rem[Math.floor(Math.random() * rem.length)]] = "N";
    rem = empty();
    slots[rem[Math.floor(Math.random() * rem.length)]] = "N";

    rem = empty().sort((a, b) => a - b);
    slots[rem[0]] = "R";
    slots[rem[1]] = "K";
    slots[rem[2]] = "R";

    return slots;
  }

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

  function freestyleBoard() {
    const whiteBack = generateBackRank(7);
    const blackBack = generateBackRank(0);
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
      b[0][c] = "b" + blackBack[c];
      b[1][c] = "bP";
      b[6][c] = "wP";
      b[7][c] = "w" + whiteBack[c];
    }
    return b;
  }

  function setupBoard() {
    return activeVariant === "freestyle" ? freestyleBoard() : initialBoard();
  }

  function newGame() {
    board = setupBoard();
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
    if (!statusEl || !turnIndicatorEl) return;
    if (winner) {
      statusEl.textContent = (winner === "w" ? "White" : "Black") + " wins!";
      turnIndicatorEl.className = "turn-indicator turn-" + (winner === "w" ? "white" : "black");
      return;
    }
    const variantLabel = activeVariant === "freestyle" ? " · Freestyle" : "";
    statusEl.textContent = (turn === "w" ? "White" : "Black") + " to move" + variantLabel;
    turnIndicatorEl.className = "turn-indicator turn-" + (turn === "w" ? "white" : "black");
  }

  function materialValue(pieces) {
    return pieces.reduce((sum, p) => sum + PIECE_VALUE[p[1]], 0);
  }

  function updateScorePanel() {
    if (!whiteCapturedEl) return;
    whiteCapturedEl.innerHTML = capturedByWhite
      .map(
        (p, i) =>
          `<span class="captured-piece black${i >= prevWhiteCaptured ? " is-new" : ""}">${getGlyph(p)}</span>`
      )
      .join("");
    blackCapturedEl.innerHTML = capturedByBlack
      .map(
        (p, i) =>
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

    const variantNote =
      activeVariant === "freestyle" && moveHistory.length === 0
        ? "Freestyle opening — back ranks were shuffled before play."
        : null;

    return {
      color,
      notation,
      from: fromSq,
      to: toSq,
      piece: type,
      pieceName: PIECE_NAMES[type],
      captured: captured ? PIECE_NAMES[captured[1]] : null,
      tip: variantNote ? `${variantNote} ${tip}` : tip,
    };
  }

  function showLesson(record, index) {
    selectedHistoryIndex = index;
    moveLessonEl.hidden = false;
    const side = record.color === "w" ? "White" : "Black";
    lessonTextEl.innerHTML =
      `<strong>${side}: ${record.notation}</strong>` +
      `<span class="lesson-detail">${record.from} → ${record.to}</span>` +
      (record.captured ? `<span class="lesson-capture">Takes ${record.captured}</span>` : "") +
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
    let nr = r + dr;
    let nc = c + dc;
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
        const nr = row + dir;
        const nc = col + dc;
        if (inBounds(nr, nc) && board[nr][nc] && board[nr][nc][0] !== color) {
          out.push({ row: nr, col: nc });
        }
      }
    } else if (type === "N") {
      for (const [dr, dc] of [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1],
      ]) {
        const nr = row + dr;
        const nc = col + dc;
        if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc][0] !== color)) {
          out.push({ row: nr, col: nc });
        }
      }
    } else if (type === "K") {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = row + dr;
          const nc = col + dc;
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
    if (!boardEl) return;
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

  function updateVariantUI() {
    if (!variantBarEl) return;
    variantBarEl.querySelectorAll(".variant-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.variant === activeVariant);
      chip.setAttribute("aria-pressed", chip.dataset.variant === activeVariant ? "true" : "false");
    });
  }

  function setVariant(variant) {
    if (activeVariant === variant) return;
    activeVariant = variant;
    saveVariant();
    updateVariantUI();
    newGame();
  }

  function bindPanelRefs() {
    whiteCapturedEl = document.getElementById("white-captured");
    blackCapturedEl = document.getElementById("black-captured");
    whitePointsEl = document.getElementById("white-points");
    blackPointsEl = document.getElementById("black-points");
    whiteCaptureCountEl = document.getElementById("white-capture-count");
    blackCaptureCountEl = document.getElementById("black-capture-count");
    whiteWinsEl = document.getElementById("white-wins");
    blackWinsEl = document.getElementById("black-wins");
    moveCountEl = document.getElementById("move-count");
    moveHistoryListEl = document.getElementById("move-history-list");
    moveLessonEl = document.getElementById("move-lesson");
    lessonTextEl = document.getElementById("lesson-text");
    statusEl = document.getElementById("status");
    turnIndicatorEl = document.getElementById("turn-indicator");
  }

  function init(mount) {
    mountEl = mount;
    activeVariant = loadVariant();
    matchWins = { w: 0, b: 0 };
    bindPanelRefs();

    mountEl.innerHTML = `
      <div class="board-column">
        <div class="variant-bar" role="group" aria-label="Chess variant">
          <button type="button" class="variant-chip" data-variant="standard" aria-pressed="false">Standard</button>
          <button type="button" class="variant-chip" data-variant="freestyle" aria-pressed="false">Freestyle</button>
        </div>
        <div class="board-frame">
          <div class="board-coords board-coords--files">
            <span>a</span><span>b</span><span>c</span><span>d</span>
            <span>e</span><span>f</span><span>g</span><span>h</span>
          </div>
          <div class="board-coords board-coords--ranks">
            <span>8</span><span>7</span><span>6</span><span>5</span>
            <span>4</span><span>3</span><span>2</span><span>1</span>
          </div>
          <div id="board"></div>
        </div>
      </div>
    `;

    boardEl = mountEl.querySelector("#board");
    variantBarEl = mountEl.querySelector(".variant-bar");
    updateVariantUI();

    boardClickHandler = (e) => {
      const sq = e.target.closest(".square");
      if (!sq) return;
      onSquareClick(Number(sq.dataset.row), Number(sq.dataset.col));
    };
    boardEl.addEventListener("click", boardClickHandler);

    historyClickHandler = (e) => {
      const btn = e.target.closest(".history-move[data-index]");
      if (!btn) return;
      const index = Number(btn.dataset.index);
      showLesson(moveHistory[index], index);
    };
    moveHistoryListEl.addEventListener("click", historyClickHandler);

    variantClickHandler = (e) => {
      const chip = e.target.closest(".variant-chip[data-variant]");
      if (!chip) return;
      setVariant(chip.dataset.variant);
    };
    variantBarEl.addEventListener("click", variantClickHandler);

    const skinChangeHandler = () => {
      render();
      updateScorePanel();
    };
    unbindSkinChange = window.ArcadeShell.onSkinChange(skinChangeHandler);

    newGame();
  }

  function destroy() {
    if (boardEl && boardClickHandler) {
      boardEl.removeEventListener("click", boardClickHandler);
    }
    if (moveHistoryListEl && historyClickHandler) {
      moveHistoryListEl.removeEventListener("click", historyClickHandler);
    }
    if (variantBarEl && variantClickHandler) {
      variantBarEl.removeEventListener("click", variantClickHandler);
    }
    if (unbindSkinChange) {
      unbindSkinChange();
      unbindSkinChange = null;
    }
    if (mountEl) mountEl.innerHTML = "";
    boardEl = null;
    variantBarEl = null;
    animating = false;
  }

  function reset() {
    newGame();
  }

  window.ArcadeGames.chess = {
    id: "chess",
    name: "Chess",
    subtitle: "Ludus Scaccorum",
    init,
    destroy,
    reset,
  };
})();

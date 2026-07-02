window.ArcadeShell = (function () {
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

  const SKIN_DEFAULTS = { piece: "classic", board: "terracotta", bg: "imperium" };
  const BOARD_SKINS = ["terracotta", "walnut", "slate", "emerald"];
  const BG_SKINS = ["imperium", "midnight", "forest", "obsidian"];
  const SKIN_STORAGE_KEY = "chess-skins";

  let activeSkins = { ...SKIN_DEFAULTS };
  const skinChangeCallbacks = [];
  let skinListeners = [];

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

  function notifySkinChange() {
    skinChangeCallbacks.forEach((fn) => fn());
  }

  function onSkinChange(fn) {
    skinChangeCallbacks.push(fn);
    return () => {
      const idx = skinChangeCallbacks.indexOf(fn);
      if (idx >= 0) skinChangeCallbacks.splice(idx, 1);
    };
  }

  function initSkinPicker() {
    loadSkins();
    applySkins();

    const pieceSelect = document.getElementById("piece-skin");
    const boardSelect = document.getElementById("board-skin");
    const bgSelect = document.getElementById("bg-skin");

    if (pieceSelect) {
      const handler = (e) => {
        activeSkins.piece = e.target.value;
        saveSkins();
        applySkins();
        notifySkinChange();
      };
      pieceSelect.addEventListener("change", handler);
      skinListeners.push({ el: pieceSelect, type: "change", handler });
    }

    if (boardSelect) {
      const handler = (e) => {
        activeSkins.board = e.target.value;
        saveSkins();
        applySkins();
      };
      boardSelect.addEventListener("change", handler);
      skinListeners.push({ el: boardSelect, type: "change", handler });
    }

    if (bgSelect) {
      const handler = (e) => {
        activeSkins.bg = e.target.value;
        saveSkins();
        applySkins();
      };
      bgSelect.addEventListener("change", handler);
      skinListeners.push({ el: bgSelect, type: "change", handler });
    }
  }

  function destroySkinPicker() {
    skinListeners.forEach(({ el, type, handler }) => {
      el.removeEventListener(type, handler);
    });
    skinListeners = [];
  }

  return {
    PIECE_SKINS,
    getGlyph,
    onSkinChange,
    initSkinPicker,
    destroySkinPicker,
  };
})();

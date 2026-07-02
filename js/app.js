(function () {
  const GAME_ORDER = ["chess", "pingpong"];
  let activeGame = null;
  let activeId = null;

  const titleEl = () => document.getElementById("game-title");
  const subtitleEl = () => document.querySelector(".subtitle");
  const mountEl = () => document.getElementById("game-mount");
  const resetBtn = () => document.getElementById("reset");

  function setPanelVisibility(gameId) {
    document.querySelectorAll("[data-panel]").forEach((el) => {
      const panels = el.dataset.panel.split(" ");
      el.hidden = !panels.includes(gameId);
    });
  }

  function updateTabs(gameId) {
    document.querySelectorAll(".game-tab").forEach((tab) => {
      const isActive = tab.dataset.game === gameId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function updateHeader(game) {
    if (titleEl()) titleEl().textContent = game.name;
    if (subtitleEl()) subtitleEl().textContent = game.subtitle || "";
  }

  function switchGame(id) {
    if (!window.ArcadeGames[id]) return;
    if (activeId === id && activeGame) return;

    if (activeGame) activeGame.destroy();

    activeId = id;
    activeGame = window.ArcadeGames[id];
    const mount = mountEl();
    if (mount) mount.innerHTML = "";

    activeGame.init(mount);
    updateHeader(activeGame);
    updateTabs(id);
    setPanelVisibility(id);
  }

  function setupTabs() {
    document.querySelectorAll(".game-tab").forEach((tab) => {
      tab.addEventListener("click", () => switchGame(tab.dataset.game));
    });
  }

  function setupReset() {
    const btn = resetBtn();
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (activeGame && activeGame.reset) activeGame.reset();
    });
  }

  function init() {
    window.ArcadeShell.initSkinPicker();
    setupTabs();
    setupReset();
    switchGame(GAME_ORDER[0]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

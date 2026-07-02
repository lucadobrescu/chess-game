window.ArcadeGames = window.ArcadeGames || {};

(function () {
  const WIN_SCORE = 11;
  const PADDLE_SPEED = 6;
  const BALL_SPEED = 5;
  const PADDLE_HEIGHT = 80;
  const PADDLE_WIDTH = 12;

  let mountEl;
  let canvas;
  let ctx;
  let animationId;
  let keysDown = {};
  let keydownHandler;
  let keyupHandler;

  let leftPaddle;
  let rightPaddle;
  let ball;
  let score;
  let matchWins;
  let gameOver;
  let paused;

  let statusEl;
  let turnIndicatorEl;
  let leftScoreEl;
  let rightScoreEl;
  let leftWinsEl;
  let rightWinsEl;

  function bindPanelRefs() {
    statusEl = document.getElementById("status");
    turnIndicatorEl = document.getElementById("turn-indicator");
    leftScoreEl = document.getElementById("pp-left-score");
    rightScoreEl = document.getElementById("pp-right-score");
    leftWinsEl = document.getElementById("pp-left-wins");
    rightWinsEl = document.getElementById("pp-right-wins");
  }

  function resetBall(direction) {
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
    const dir = direction || (Math.random() < 0.5 ? -1 : 1);
    ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: Math.cos(angle) * BALL_SPEED * dir,
      vy: Math.sin(angle) * BALL_SPEED,
      radius: 8,
    };
    paused = true;
    setTimeout(() => {
      paused = false;
    }, 800);
  }

  function resetRally() {
    leftPaddle = { x: 16, y: canvas.height / 2 - PADDLE_HEIGHT / 2, w: PADDLE_WIDTH, h: PADDLE_HEIGHT };
    rightPaddle = {
      x: canvas.width - 16 - PADDLE_WIDTH,
      y: canvas.height / 2 - PADDLE_HEIGHT / 2,
      w: PADDLE_WIDTH,
      h: PADDLE_HEIGHT,
    };
    score = { left: 0, right: 0 };
    gameOver = false;
    resetBall();
    updatePanel();
    updateStatus();
  }

  function newMatch() {
    resetRally();
    matchWins = { left: 0, right: 0 };
    updatePanel();
  }

  function updateStatus(winner) {
    if (!statusEl || !turnIndicatorEl) return;
    if (winner === "left") {
      statusEl.textContent = "Left player wins the match!";
      turnIndicatorEl.className = "turn-indicator turn-white";
      return;
    }
    if (winner === "right") {
      statusEl.textContent = "Right player wins the match!";
      turnIndicatorEl.className = "turn-indicator turn-black";
      return;
    }
    if (gameOver) {
      statusEl.textContent = paused ? "Point scored — next serve…" : "Point in play";
      return;
    }
    statusEl.textContent = paused ? "Serve…" : "W/S vs ↑/↓";
    turnIndicatorEl.className = "turn-indicator turn-white";
  }

  function updatePanel() {
    if (leftScoreEl) leftScoreEl.textContent = score.left;
    if (rightScoreEl) rightScoreEl.textContent = score.right;
    if (leftWinsEl) {
      leftWinsEl.textContent = matchWins.left;
      leftWinsEl.classList.toggle("is-leading", matchWins.left > matchWins.right);
    }
    if (rightWinsEl) {
      rightWinsEl.textContent = matchWins.right;
      rightWinsEl.classList.toggle("is-leading", matchWins.right > matchWins.left);
    }
  }

  function checkMatchWin() {
    const max = Math.max(score.left, score.right);
    const min = Math.min(score.left, score.right);
    if (max >= WIN_SCORE && max - min >= 2) {
      paused = true;
      if (score.left > score.right) {
        matchWins.left++;
        updateStatus("left");
      } else {
        matchWins.right++;
        updateStatus("right");
      }
      updatePanel();
      setTimeout(() => {
        score = { left: 0, right: 0 };
        gameOver = false;
        resetBall();
        updatePanel();
        updateStatus();
      }, 1200);
      return true;
    }
    return false;
  }

  function scorePoint(side) {
    if (side === "left") score.left++;
    else score.right++;
    updatePanel();
    if (!checkMatchWin()) {
      resetBall(side === "left" ? 1 : -1);
      updateStatus();
    }
  }

  function clampPaddle(paddle) {
    paddle.y = Math.max(0, Math.min(canvas.height - paddle.h, paddle.y));
  }

  function update() {
    if (paused) return;

    if (keysDown.w || keysDown.W) leftPaddle.y -= PADDLE_SPEED;
    if (keysDown.s || keysDown.S) leftPaddle.y += PADDLE_SPEED;
    if (keysDown.ArrowUp) rightPaddle.y -= PADDLE_SPEED;
    if (keysDown.ArrowDown) rightPaddle.y += PADDLE_SPEED;

    clampPaddle(leftPaddle);
    clampPaddle(rightPaddle);

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
      ball.vy *= -1;
      ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }

    if (
      ball.x - ball.radius <= leftPaddle.x + leftPaddle.w &&
      ball.y >= leftPaddle.y &&
      ball.y <= leftPaddle.y + leftPaddle.h &&
      ball.vx < 0
    ) {
      ball.vx = Math.abs(ball.vx) * 1.04;
      const hit = (ball.y - (leftPaddle.y + leftPaddle.h / 2)) / (leftPaddle.h / 2);
      ball.vy = hit * BALL_SPEED * 1.1;
    }

    if (
      ball.x + ball.radius >= rightPaddle.x &&
      ball.y >= rightPaddle.y &&
      ball.y <= rightPaddle.y + rightPaddle.h &&
      ball.vx > 0
    ) {
      ball.vx = -Math.abs(ball.vx) * 1.04;
      const hit = (ball.y - (rightPaddle.y + rightPaddle.h / 2)) / (rightPaddle.h / 2);
      ball.vy = hit * BALL_SPEED * 1.1;
    }

    if (ball.x < 0) {
      scorePoint("right");
      return;
    }
    if (ball.x > canvas.width) {
      scorePoint("left");
    }
  }

  function drawCourt() {
    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#2a4a38");
    grad.addColorStop(1, "#1a3028");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(201, 162, 39, 0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(201, 162, 39, 0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);
  }

  function drawPaddle(paddle, light) {
    ctx.fillStyle = light ? "#f5f0e4" : "#2a1f14";
    ctx.shadowColor = "rgba(201, 162, 39, 0.4)";
    ctx.shadowBlur = 8;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.shadowBlur = 0;
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#c9a227";
    ctx.shadowColor = "rgba(201, 162, 39, 0.8)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function draw() {
    drawCourt();
    drawPaddle(leftPaddle, true);
    drawPaddle(rightPaddle, false);
    drawBall();
  }

  function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resizeCanvas() {
    const col = mountEl.querySelector(".pingpong-column");
    const maxW = col ? col.clientWidth : 520;
    canvas.width = Math.min(maxW, 520);
    canvas.height = Math.round(canvas.width * 0.55);
    if (leftPaddle) {
      rightPaddle.x = canvas.width - 16 - PADDLE_WIDTH;
      leftPaddle.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, leftPaddle.y));
      rightPaddle.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightPaddle.y));
      ball.x = Math.min(Math.max(ball.x, ball.radius), canvas.width - ball.radius);
      ball.y = Math.min(Math.max(ball.y, ball.radius), canvas.height - ball.radius);
    }
  }

  function init(mount) {
    mountEl = mount;
    bindPanelRefs();

    mountEl.innerHTML = `
      <div class="pingpong-column">
        <div class="pingpong-frame">
          <canvas id="pingpong-canvas" aria-label="Ping-Pong court"></canvas>
          <p class="pingpong-hint">Left: W / S &nbsp;·&nbsp; Right: ↑ / ↓</p>
        </div>
      </div>
    `;

    canvas = mountEl.querySelector("#pingpong-canvas");
    ctx = canvas.getContext("2d");
    resizeCanvas();

    matchWins = { left: 0, right: 0 };
    resetRally();

    keydownHandler = (e) => {
      if (["w", "W", "s", "S", "ArrowUp", "ArrowDown"].includes(e.key)) {
        keysDown[e.key] = true;
        if (e.key.startsWith("Arrow")) e.preventDefault();
      }
    };
    keyupHandler = (e) => {
      keysDown[e.key] = false;
    };
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    window.addEventListener("resize", resizeCanvas);
    animationId = requestAnimationFrame(loop);
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    if (keydownHandler) window.removeEventListener("keydown", keydownHandler);
    if (keyupHandler) window.removeEventListener("keyup", keyupHandler);
    window.removeEventListener("resize", resizeCanvas);
    keysDown = {};
    if (mountEl) mountEl.innerHTML = "";
    canvas = null;
    ctx = null;
  }

  function reset() {
    newMatch();
  }

  window.ArcadeGames.pingpong = {
    id: "pingpong",
    name: "Ping-Pong",
    subtitle: "Ludus Pila",
    init,
    destroy,
    reset,
  };
})();

import { useEffect, useState } from "react";

export default function Game() {
  const [ghosts, setGhosts] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(15);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [status, setStatus] = useState("start");
  const [levelCatch, setLevelCatch] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("highScore")) || 0
  );

  const speed = 1 + (level - 1) * 0.25;
  const minCatch = level <= 2 ? 8 : level <= 4 ? 5 : 3;

  // RESET FUNCTION (NEW)
  const resetGame = () => {
    setGhosts([]);
    setScore(0);
    setTime(15);
    setLevel(1);
    setGameOver(false);
    setGameStarted(false);
    setCountdown(3);
    setStatus("start");
    setLevelCatch(0);
  };

  // START BUTTON → COUNTDOWN
  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (countdown === 0) setStatus("playing");
  }, [gameStarted, countdown]);

  // TIMER
  useEffect(() => {
    if (status !== "playing") return;

    if (time <= 0) {
      if (levelCatch < minCatch) {
        setStatus("failed");
        setGameOver(true);
        return;
      }

      if (level < 5) {
        setLevel((prev) => prev + 1);
        setTime(15);
        setLevelCatch(0);
      } else {
        setGameOver(true);
        setStatus("completed");
      }
      return;
    }

    const timer = setTimeout(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time, level, status]);

  // SPAWN
  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      const newGhost = {
        id: Math.random(),
        x: Math.random() * 90,
        y: Math.random() * 90,
      };

      setGhosts((prev) => [...prev, newGhost]);

      setTimeout(() => {
        setGhosts((prev) =>
          prev.filter((g) => g.id !== newGhost.id)
        );
      }, 2000 / speed);
    }, 800 / speed);

    return () => clearInterval(interval);
  }, [level, status]);

  // CAPTURE
  const capture = (id, e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    const poke = document.createElement("div");
    poke.innerText = "☠️";
    poke.style.position = "absolute";
    poke.style.left = x + "px";
    poke.style.top = y + "px";
    poke.style.fontSize = "25px";
    poke.style.pointerEvents = "none";

    document.body.appendChild(poke);
    setTimeout(() => poke.remove(), 200);

    setScore((prev) => prev + 1);
    setLevelCatch((prev) => prev + 1);
    setGhosts((prev) => prev.filter((g) => g.id !== id));
  };

  // SAVE HIGH SCORE
  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        localStorage.setItem("highScore", score);
        setHighScore(score);
      }
    }
  }, [gameOver]);

  return (
    <div className="game-container">
      {/* START SCREEN */}
      {status === "start" && (
        <div className="center">
          <h1>GHOST HUNT ☠️</h1>
          <button onClick={() => setGameStarted(true)}>▶</button>
          <div className="rule">
            <p>
              - The game has 5 levels in total.<br />
              - Levels 1 & 2: You must catch at least 8 ghosts to advance.<br />
              - Levels 3 & 4: You must catch at least 5 ghosts to move forward.<br />
              - Level 5 (Final Level): You must catch 3 ghosts to win.<br />
              - If you fail to meet the minimum ghost requirement in any level, you will lose the game.<br />
            </p>
          </div>
        </div>
      )}

      {/* COUNTDOWN */}
      {gameStarted && countdown > 0 && (
        <div className="center">
          <h1>{countdown}</h1>
        </div>
      )}

      {/* GAME */}
      {status === "playing" && (
        <>
          <div className="hud">
            <h2>Level: {level}</h2>
            <h2>Time: {time}s</h2>
            <h2 style={{ color: levelCatch >= minCatch ? "blue" : "red" }}>
              Score: {score}
            </h2>
          </div>

          {ghosts.map((g) => (
            <div
              key={g.id}
              className="ghost"
              style={{
                left: `${g.x}%`,
                top: `${g.y}%`,
                animationDuration: `${2 / speed}s`,
              }}
              onPointerDown={(e) => capture(g.id, e)}
            >
              👻
            </div>
          ))}
        </>
      )}

      {/* GAME OVER */}
      {gameOver && (
        <div className="center">
          <h1>{status === "failed" ? "HUNT FAILED ❌" : "Game Over 🏆"}</h1>
          <h2>Score: {score}</h2>
          <h2>Highest Score: {highScore}</h2>

          {/* PLAY AGAIN BUTTON */}
          <button onClick={resetGame}>🔁 Play Again</button>
        </div>
      )}
    </div>
  );
}
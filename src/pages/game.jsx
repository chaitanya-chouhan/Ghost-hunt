import { useEffect, useState, useRef } from "react";

const screamTemplate = typeof Audio !== "undefined" ? new Audio("/scream.mp3") : null;
if (screamTemplate) {
  screamTemplate.preload = "auto";
}

export default function Game() {
  const [ghosts, setGhosts] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(18);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [status, setStatus] = useState("start");
  const [levelCatch, setLevelCatch] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("highScore") || 0)
  );

  // --- AUDIO LOGIC START ---
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio object
    audioRef.current = new Audio("/horror-ambience.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
    if (audioRef.current) {
      audioRef.current.play().catch(error => console.log("Audio waiting for interaction"));
    }
  };
  // --- AUDIO LOGIC END ---

  const speed = 1 + (level - 1) * 0.3;
  const minCatch = level <= 2 ? 8 : level <= 4 ? 5 : 3;
  const neededToCatch = Math.max(0, minCatch - levelCatch);

  const resetGame = () => {
    setGhosts([]);
    setScore(0);
    setTime(18);
    setLevel(1);
    setGameOver(false);
    setGameStarted(false);
    setCountdown(3);
    setStatus("start");
    setLevelCatch(0);
  };

  // COUNTDOWN
  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (countdown === 0) setStatus("playing");
  }, [gameStarted, countdown]);

  // LEVEL TRANSITION DELAY
  useEffect(() => {
    if (status === "levelTransition") {
      const t = setTimeout(() => {
        setStatus("playing");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [status]);

  // TIME TICKER
  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // LEVEL END EVALUATION
  useEffect(() => {
    if (status === "playing" && time <= 0) {
      if (levelCatch < minCatch) {
        setStatus("failed");
        setGameOver(true);
      } else if (level < 5) {
        setLevel((prev) => prev + 1);
        setTime(18);
        setLevelCatch(0);
        setGhosts([]);
        setStatus("levelTransition");
      } else {
        setGameOver(true);
        setStatus("completed");
      }
    }
  }, [time, status, levelCatch, minCatch, level]);


  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      const newGhost = {
        id: Math.random(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 30 + 50,
      };

      setGhosts((prev) => {
        if (prev.length > 10) return prev;
        return [...prev, newGhost];
      });


      setTimeout(() => {
        setGhosts((prev) =>
          prev.filter((g) => g.id !== newGhost.id)
        );
      }, 2000);
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [level, status, speed]);

  // CAPTURE
  const capture = (id, e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    // Clone preloaded audio to eliminate decoding latency on rapid taps
    if (screamTemplate) {
      const screamClone = screamTemplate.cloneNode();
      screamClone.play().catch(err => console.log("Audio play failed:", err));
    }

    const touches = e.changedTouches || e.touches;
    const x = touches && touches.length > 0 ? touches[0].clientX : e.clientX;
    const y = touches && touches.length > 0 ? touches[0].clientY : e.clientY;

    const poke = document.createElement("div");
    poke.innerText = "☠️";
    poke.style.position = "absolute";
    poke.style.left = x + "px";
    poke.style.top = y + "px";
    poke.style.fontSize = "25px";
    poke.style.pointerEvents = "none";
    poke.className = "poke-effect";

    document.body.appendChild(poke);
    setTimeout(() => poke.remove(), 600);

    setScore((prev) => prev + 1);
    setLevelCatch((prev) => prev + 1);
    setGhosts((prev) => prev.filter((g) => g.id !== id));
  };

  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        localStorage.setItem("highScore", score);
        setHighScore(score);
      }
    }
  }, [gameOver, score, highScore]);

  return (
    <div className="game-container">

      {/* Start screen */}
      {status === "start" && (
        <div className="center">
          <h1>GHOST HUNT ☠️</h1>
          {/* Changed onClick to trigger audio */}
          <button onClick={handleStartGame}>▶</button>

          <div className="rule">
            <p>
              <span>The game has 5 levels in total.</span>
              <span>Levels 1 & 2: Catch at least 8 specters to advance.</span>
              <span>Levels 3 & 4: Catch at least 5 specters to advance.</span>
              <span>Level 5 (Final Level): Catch 3 specters to win.</span>
              <span>If you fail to meet the requirement, you lose.</span>
            </p>
          </div>
        </div>
      )}


      {gameStarted && countdown > 0 && (
        <div className="center center-transparent">
          <h1 className="countdown-text">{countdown}</h1>
        </div>
      )}

      {/* Level change */}
      {status === "levelTransition" && (
        <div className="center center-transparent">
          <h1 className="level-transition-text">LEVEL {level}</h1>
        </div>
      )}

      {/* game */}
      {status === "playing" && (
        <>
          <div className="hud">
            <h2>Level {level}</h2>
            <h2>00:{time.toString().padStart(2, "0")}</h2>
            <h2>Score: {score}</h2>
            <h2 className={neededToCatch <= 0 ? "score-green" : "score-red"}>
              Needed: {neededToCatch}
            </h2>
          </div>

          <div style={{ position: "absolute", top: "100px", bottom: "0", left: "0", right: "0", overflow: "hidden" }}>
            {ghosts.map((g) => (
              <div
                key={g.id}
                className="ghost"
                style={{
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  animation: `float-up ${4 / speed}s linear forwards`,
                }}
                onTouchStart={(e) => capture(g.id, e)}
                onMouseDown={(e) => capture(g.id, e)}
              >
                👻
              </div>
            ))}
          </div>
        </>
      )}

      {/* game end */}
      {gameOver && (
        <div className="center">
          <h1>{status === "failed" ? "HUNT FAILED 💀" : "HUNT ACCOMPLISHED 🏆"}</h1>
          <h2 style={{ color: status === "failed" ? "#f43f5e" : "#3b82f6" }}>
            Final Score: {score}
          </h2>
          <h2>Highest Score:{highScore}</h2>
          <button onClick={resetGame}>🔁 Play Again</button>
        </div>
      )}
    </div>
  );
}
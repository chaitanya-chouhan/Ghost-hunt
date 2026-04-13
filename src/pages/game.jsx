import { useEffect, useState, useRef } from "react";

const screamTemplate = typeof Audio !== "undefined" ? new Audio("/scream.mp3") : null;
if (screamTemplate) {
  screamTemplate.preload = "auto";
}
const lightTemplate = typeof Audio !== "undefined" ? new Audio("/light.mp3") : null;
if (lightTemplate) {
  lightTemplate.preload = "auto";
}
const darkTemplate = typeof Audio !== "undefined" ? new Audio("/dark.mp3") : null;
if (darkTemplate) {
  darkTemplate.preload = "auto";
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
  
  const [crossTimers, setCrossTimers] = useState([]);
  const [holyFlash, setHolyFlash] = useState(null);
  const [darkFlash, setDarkFlash] = useState(null);
  const holyActiveRef = useRef(false);

  
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
  // --- Audio end ---

  const speed = 1 + (level - 1) * 0.3;
  const minCatch = level <= 2 ? 12 : level === 3 ? 14 : level <= 5 ? 18 : 16;
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
    setCrossTimers([]);
    setHolyFlash(null);
    setDarkFlash(null);
    holyActiveRef.current = false;
  };

  
  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (countdown === 0) setStatus("playing");
  }, [gameStarted, countdown]);

  // Level change delay & Cross timer calculation
  useEffect(() => {
    if (status === "levelTransition") {
      const t = setTimeout(() => {
        let numCrosses = 0;
        if (level === 3) numCrosses = 1;
        if (level === 4) numCrosses = 3;
        if (level === 5) numCrosses = 2;
        if (level === 6) numCrosses = 1;
        
        const timers = [];
        while (timers.length < numCrosses) {
          const randomSec = Math.floor(Math.random() * 15) + 2; 
          if (!timers.includes(randomSec)) timers.push(randomSec);
        }
        setCrossTimers(timers);
        setStatus("playing");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [status, level]);

  
  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // cross
  useEffect(() => {
    if (status === "playing" && crossTimers.includes(time)) {
      const newCross = {
        id: Math.random(),
        x: Math.random() * 60 + 20,
        y: Math.random() * 30 + 50,
        type: 'cross'
      };
      setGhosts(prev => [...prev, newCross]);
      setCrossTimers(prev => prev.filter(t => t !== time));

      setTimeout(() => {
        setGhosts((prev) => prev.filter((g) => g.id !== newCross.id));
      }, 2000);
    }
  }, [time, status, crossTimers]);

  
  useEffect(() => {
    if (status === "playing" && time <= 0) {
      if (levelCatch < minCatch) {
        setStatus("failed");
        setGameOver(true);
      } else if (level < 6) {
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
      if (holyActiveRef.current) {
        setScore(s => s + 1);
        setLevelCatch(c => c + 1);
        return;
      }

      const isBlackGhost = Math.random() < 0.1;
      const newGhost = {
        id: Math.random(),
        x: Math.random() * 60 + 20,
        y: Math.random() * 30 + 50,
        type: isBlackGhost ? 'black_ghost' : 'ghost'
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

  const capture = (g, e) => {
    e.stopPropagation();
    if (e.cancelable && e.preventDefault) e.preventDefault();
    if (g.caught) return;
    g.caught = true;
    
    if (g.type === 'cross') {
      if (lightTemplate) {
        const lightClone = lightTemplate.cloneNode();
        lightClone.play().catch(err => console.log("Audio play failed:", err));
      }

      const touches = e.changedTouches || e.touches;
      const x = touches && touches.length > 0 ? touches[0].clientX : e.clientX;
      const y = touches && touches.length > 0 ? touches[0].clientY : e.clientY;
      
      setHolyFlash({ x, y });
      holyActiveRef.current = true;
      
      setGhosts(prev => {
        const remainingGhosts = prev.filter(entity => entity.id !== g.id);
        const countToKill = remainingGhosts.filter(entity => entity.type !== 'cross').length;
        if (countToKill > 0) {
          setScore(s => s + countToKill);
          setLevelCatch(c => c + countToKill);
        }
        return [];
      });
      
      setTimeout(() => {
        holyActiveRef.current = false;
        setHolyFlash(null);
      }, 1500);
      return;
    }

    if (g.type === 'black_ghost') {
      if (darkTemplate && !holyActiveRef.current) {
        const darkClone = darkTemplate.cloneNode();
        darkClone.play().catch(err => console.log("Audio play failed:", err));
      }
      setDarkFlash(Math.random());
      setTimeout(() => setDarkFlash(null), 1500);
    } else {
      if (screamTemplate && !holyActiveRef.current) {
        const screamClone = screamTemplate.cloneNode();
        screamClone.play().catch(err => console.log("Audio play failed:", err));
      }
    }

    const touches = e.changedTouches || e.touches;
    const x = touches && touches.length > 0 ? touches[0].clientX : e.clientX;
    const y = touches && touches.length > 0 ? touches[0].clientY : e.clientY;

    const poke = document.createElement("img");
    poke.src = "/skull.png";
    poke.style.position = "absolute";
    poke.style.left = x + "px";
    poke.style.top = y + "px";
    poke.style.width = "50px";
    poke.style.height = "50px";
    poke.style.objectFit = "contain";
    poke.style.filter = "drop-shadow(0 0 6px rgba(255, 0, 0, 0.5))";
    poke.style.pointerEvents = "none";
    poke.className = "poke-effect";

    document.body.appendChild(poke);
    setTimeout(() => poke.remove(), 600);

    if (g.type === 'black_ghost') {
      setScore((prev) => prev - 3);
      setLevelCatch((prev) => prev - 3);
    } else {
      setScore((prev) => prev + 1);
      setLevelCatch((prev) => prev + 1);
    }
    setGhosts((prev) => prev.filter((item) => item.id !== g.id));
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
      {status==="start" && (
        <div className="center">
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', lineHeight: '1' }}>
            <span>GHOST HUNT</span>
            <img src="/ghostimg.png" alt="Ghost" style={{ width: '2.5em', height: '2.5em', objectFit: 'contain', margin: '-0.7em 0' }} />
          </h1>
          {/* Changed onClick to trigger audio */}
          <button onClick={handleStartGame}>▶</button>

          <div className="rule">
            <p>
              <span>The game has 6 levels in total.</span>
              <span>Obtain the Holy Cross (♱) for a special attack.</span>
              <span>Levels 1 & 2: Catch at least 12 ghosts to advance.</span>
              <span>Level 3: Catch at least 14 ghosts to advance.</span>
              <span>Levels 4 & 5: Catch at least 18 ghosts to advance.</span>
              <span>Level 6 (Final Level): Catch at least 16 ghosts to win.</span>
              <span>If you fail to meet the requirement, you lose.</span>
            </p>
          </div>
        </div>
      )}


      {gameStarted&&countdown>0&& (
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

          {darkFlash && (
            <div key={darkFlash} className="dark-flash">
              <img src="/skull.png" className="jumpscare-skull" alt="skull jump scare" />
            </div>
          )}
          <div style={{ position: "absolute", top: "100px", bottom: "0", left: "0", right: "0", overflow: "hidden" }}>
            {holyFlash && (
              <div 
                className="holy-flash" 
                style={{ '--origin-x': `${holyFlash.x}px`, '--origin-y': `${holyFlash.y}px` }} 
              />
            )}
            {ghosts.map((g) => (
              <div
                key={g.id}
                className={g.type === 'cross' ? 'cross' : 'ghost'}
                style={{
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  animation: `float-up ${4 / speed}s linear forwards`,
                }}
                onPointerDown={(e) => capture(g, e)}
              >
                {g.type === 'cross' ? '♱' : (
                  g.type === 'black_ghost' ? 
                  <img src="/black_Ghost.png" alt="Black Ghost" className="ghost-img black-ghost" /> :
                  <img src="/ghostimg.png" alt="Ghost" className="ghost-img" />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* game end */}
      {gameOver && (
        <div className={`center ${status === "failed" ? "failed-screen" : ""}`}>
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
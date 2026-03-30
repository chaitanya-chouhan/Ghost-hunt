import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Game from "./pages/game";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}
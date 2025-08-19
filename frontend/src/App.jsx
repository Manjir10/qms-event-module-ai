import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import List from "./pages/List";
import Wizard from "./pages/Wizard";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <div className="brand"><Link to="/">QMS Module</Link></div>
        <div className="links">
          <Link to="/">Events</Link>
          <Link to="/wizard">Create</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<List />} />
        <Route path="/wizard" element={<Wizard />} />
      </Routes>
      <footer className="foot">Life-Science QMS • Demo for Round 3</footer>
    </BrowserRouter>
  );
}

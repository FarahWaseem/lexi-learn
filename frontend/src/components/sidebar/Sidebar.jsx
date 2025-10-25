import { Link } from "react-router-dom";
import { useState } from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import DashboardIcon from "/src/assets/icons/home.svg";
import LessonIcon from "/src/assets/icons/book.svg";
import VocabIcon from "/src/assets/icons/book-saved.svg";

export default function Sidebar() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode"); 
  };

  return (
    <div className={`sidebar ${darkMode ? "dark" : "light"}`}>
      <div className="sidebar-header">
        <img src="/src/assets/icons/Logo.svg" alt="Logo" className="logo" />
        <div className="header-text">
          <span className="title">Lexil</span>
          <span className="subtitle">Learn</span>
        </div>
      </div>

      <hr />

      <div className="sidebar-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <img src={DashboardIcon} className="icon" /> Dashboard
        </NavLink>

        <NavLink
          to="/lessons"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <img src={LessonIcon} className="icon" /> Lesson
        </NavLink>
        <NavLink
          to="/vocabsNotebook"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <img src={VocabIcon} className="icon" />
          VocabNotebook
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <label className="switch">
          <input type="checkbox" checked={darkMode} onChange={toggleMode} />
          <span className="slider round"></span>
        </label>
        <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
      </div>
    </div>
  );
}

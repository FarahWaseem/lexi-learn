import { NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import "./Sidebar.css";
import DashboardIcon from "../../assets/icons/home.svg";
import LessonIcon from "../../assets/icons/book.svg";
import VocabIcon from "../../assets/icons/book-saved.svg";
import SunIcon from "../../assets/icons/sun.svg";
import MoonIcon from "../../assets/icons/moon.svg";

export default function Sidebar() {
  const { darkMode, toggleTheme } = useTheme(); 

  return (
    <div className={`sidebar ${darkMode ? "dark" : "light"}`}>
      <div className="sidebar-main">
        <div className="sidebar-top">
          <div className="sidebar-header">
            <img src="/src/assets/icons/Logo.svg" alt="Logo" className="logo" />
            <span className="brand">
              Lexil <span className="highlight">Learn</span>
            </span>
          </div>

          <div className="sidebar-divider" />
        </div>

        <div className="sidebar-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <img src={DashboardIcon} alt="Dashboard" className="icon" /> Dashboard
          </NavLink>

          <NavLink
            to="/lessons"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <img src={LessonIcon} className="icon" /> Lessons
          </NavLink>

          <NavLink
            to="/vocabsNotebook"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <img src={VocabIcon} className="icon" /> VocabNotebook
          </NavLink>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <div className="mode-toggle" onClick={toggleTheme}>
          <div className={`toggle-option ${!darkMode ? "active" : ""}`}>
            <span>Light</span>
            <img src={SunIcon} alt="Sun Icon" className="mode-icon" />
          </div>
          <div className={`toggle-option ${darkMode ? "active" : ""}`}>
            <img src={MoonIcon} alt="Moon Icon" className="mode-icon" />
          </div>
        </div>
      </div>
    </div>
  );
}
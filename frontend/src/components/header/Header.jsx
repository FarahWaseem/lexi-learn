import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useUser } from "../../context/UserContext"; 
import Settings from "./settings/Settings";
import "./Header.css";

function Header() {
  const location = useLocation();
  const { userData } = useUser(); 
  const [lang, setLang] = useState("EN");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const pageInfo = {
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Overview",
      img: "/src/assets/images/zaytoonaReadingBook.png",
    },
    "/lesson": {
      title: "Lesson",
      subtitle: "Manage your app",
      img: "/src/assets/images/lessonpage.png",
    },
    "/vocabsNotebook": {
      title: "Vocabs notebook",
      subtitle: "Your details",
      img: "/src/assets/images/lessonpage.png",
    },
    "/lessonSammary": {
      title: "Lesson Summary",
      subtitle: "Your details",
      img: "/src/assets/images/lessonpage.png",
    },
  };

  const current = pageInfo[location.pathname] || {
    title: "Welcome",
    subtitle: "Choose a page",
    img: "/src/assets/images/zaytoonaReadingBook.png",
  };

  const handleOpenSettings = () => {
    setIsProfileOpen(false);
    setIsSettingsOpen(true);
    document.body.style.overflow = "hidden";
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img src={current.img} alt="page-icon" className="page-icon" />
          <div className="page-texts">
            <h2 className="page-title">{current.title}</h2>
            <p className="page-subtitle">{current.subtitle}</p>
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={() => setLang(lang === "EN" ? "AR" : "EN")}
            className="lang-btn"
          >
            {lang}
          </button>

          <div className="notification-wrapper">
            <img
              src="/src/assets/icons/notification.svg"
              alt="notifications"
              className="notification-icon"
            />
            <span className="notification-badge">1</span>
          </div>

          <div className="profile-wrapper">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="profile-btn"
            >
              <img
                src={
                  userData.avatar || "/src/assets/icons/User Circle.svg"
                }
                alt="profile"
                className="profile-img"
              />
              <span className="profile-name">
                {userData.firstName} {userData.lastName}
              </span>
              <img
                src="/src/assets/icons/arrow-down.svg"
                alt="arrow"
                className="arrow-down"
              />
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <button
                  onClick={handleOpenSettings}
                  className="profile-setting"
                >
                  <img
                    src="/src/assets/icons/setting-2.svg"
                    alt="Setting"
                    className="setting-img"
                  />
                  <h5>Setting</h5>
                </button>

                <div className="profile-logout">
                  <img
                    src="/src/assets/icons/Logout icon.svg"
                    alt="Logout"
                    className="setting-img"
                  />
                  <h5>Logout</h5>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          document.body.style.overflow = "auto";
        }}
      />
    </>
  );
}

export default Header;
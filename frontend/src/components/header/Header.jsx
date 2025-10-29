import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser as useClerkUser, useClerk } from "@clerk/clerk-react";
import { useUser } from "../../context/UserContext"; 
import Settings from "./settings/Settings";
import ProfileDropdown from "./ProfileDropdown/ProfileDropdown";
import "./Header.css";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: localUser } = useUser();
  const { user: clerkUser } = useClerkUser();
  const { signOut } = useClerk();
  
  // Use Clerk user data if available, otherwise fall back to local user
  const user = clerkUser ? {
    firstName: clerkUser.firstName || localUser.firstName,
    lastName: clerkUser.lastName || localUser.lastName,
    avatar: clerkUser.imageUrl || localUser.avatar
  } : localUser;
  
  const [lang, setLang] = useState("EN");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const handleLogout = async () => {
    await signOut();
    navigate("/sign-in");
  };

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
              src={user.avatar || "/src/assets/icons/User Circle.svg"}
                alt="profile"
                className="profile-img"
                />
              <span className="profile-name">
              {user.firstName} {user.lastName}
              </span>

              <img
                src="/src/assets/icons/arrow-down.svg"
                alt="arrow"
                className="arrow-down"
              />
            </button>

            {isProfileOpen && (
              <ProfileDropdown
              onSettingsClick={handleOpenSettings}
              onLogoutClick={handleLogout}
              />
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
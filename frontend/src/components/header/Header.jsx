import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useClerk, useAuth, useUser as useClerkUser } from "@clerk/clerk-react";
import { useUser as useLocalUser } from "../../context/UserContext";
import { useLessonHeader } from "../../context/LessonContext"; // ✅ NEW
import Settings from "./settings/Settings";
import ProfileDropdown from "./ProfileDropdown/ProfileDropdown";
import "./header.css";

import imgZaytoona from "../../assets/images/zaytoonaReadingBook.png";
import imgLessonPage from "../../assets/images/lessonpage.png";
import iconNotif from "../../assets/icons/notification.svg";
import iconUserCircle from "../../assets/icons/User Circle.svg";
import iconArrowDown from "../../assets/icons/arrow-down.svg";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function Header() {
  const location = useLocation();
  const { lessonHeader, setLessonHeader } = useLessonHeader(); 

  const [lang, setLang] = useState("EN");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { user: localUser } = useLocalUser() || { user: {} };

  const [firstName, setFirstName] = useState(
    clerkUser?.firstName || localUser?.firstName || "User"
  );

  useEffect(() => {
    let abort = false;

    (async () => {
      try {
        if (!navigator.onLine) {
          const cached = localStorage.getItem("me");
          if (cached && !abort) {
            const cachedUser = JSON.parse(cached);
            setFirstName(cachedUser?.first_name || firstName);
          }
          return;
        }

        const token = await getToken();
        if (!token) throw new Error("Missing Clerk token");

        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch /api/me");

        const data = await res.json();
        if (!abort && data?.ok && data?.user?.first_name) {
          setFirstName(data.user.first_name);
          try {
            localStorage.setItem("me", JSON.stringify(data.user));
          } catch {}
        }
      } catch {
        if (!abort) {
          setFirstName(
            clerkUser?.firstName || localUser?.firstName || "User"
          );
        }
      }
    })();

    return () => {
      abort = true;
    };
  }, [getToken, clerkUser?.firstName]);

  const staticPages = {
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Overview",
      img: imgZaytoona,
    },
    "/lessons": {
      title: "Lessons",
      subtitle: "Browse all lessons",
      img: imgLessonPage,
    },
    "/vocabsNotebook": {
      title: "Vocabs notebook",
      subtitle: "Your saved words",
      img: imgLessonPage,
    },
    "/settings": {
      title: "Settings",
      subtitle: "Manage your account",
      img: imgLessonPage,
    },
  };

  let current = staticPages[location.pathname] || {
    title: "Welcome",
    subtitle: "Choose a page",
    img: imgZaytoona,
  };

  if (lessonHeader) {
    current = {
      ...current,
      title: lessonHeader.title || current.title,
      subtitle: lessonHeader.subtitle || current.subtitle,
      img: imgLessonPage,
    };
  }

  useEffect(() => {
    if (!location.pathname.startsWith("/lesson")) {
      setLessonHeader(null);
    }
  }, [location.pathname, setLessonHeader]);

  const handleOpenSettings = () => {
    setIsProfileOpen(false);
    setIsSettingsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleLogout = async () => {
    try {
      setIsProfileOpen(false);
      await signOut({ redirectUrl: "/login" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const avatarSrc =
    localUser?.avatar || clerkUser?.imageUrl || iconUserCircle;

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
              src={iconNotif}
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
              <img src={avatarSrc} alt="profile" className="profile-img" />
              <span className="profile-name">{firstName}</span>
              <img src={iconArrowDown} alt="arrow" className="arrow-down" />
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

      <Settings isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </>
  );
}

export default Header;
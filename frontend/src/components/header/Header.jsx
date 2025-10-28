// Header.jsx — يعرض الاسم الأول فقط من قاعدة البيانات
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useClerk, useAuth, useUser } from "@clerk/clerk-react";
import "./Header.css";

// ✅ استيراد الصور والأيقونات كـ modules ليشتغلوا في build + PWA
import imgZaytoona from "../../assets/images/zaytoonaReadingBook.png";
import imgLessonPage from "../../assets/images/lessonpage.png";
import iconNotif from "../../assets/icons/notification.svg";
import iconUserCircle from "../../assets/icons/User Circle.svg";
import iconArrowDown from "../../assets/icons/arrow-down.svg";
import iconSetting from "../../assets/icons/setting-2.svg";
import iconLogout from "../../assets/icons/Logout icon.svg";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function Header() {
  const location = useLocation();
  const [lang, setLang] = useState("EN");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

  const [firstName, setFirstName] = useState(clerkUser?.firstName || "User");

  // 🔹 جلب الاسم من قاعدة البيانات (العمود first_name فقط)
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        // ✅ لو مافي إنترنت، استخدم الاسم من التخزين المحلي
        if (!navigator.onLine) {
          const cached = localStorage.getItem("me");
          if (cached && !abort)
            setFirstName(JSON.parse(cached)?.first_name || firstName);
          return;
        }

        const token = await getToken();
        if (!token) throw new Error("Missing Clerk token");

        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!abort && data?.ok && data?.user?.first_name) {
          setFirstName(data.user.first_name);
          try {
            localStorage.setItem("me", JSON.stringify(data.user));
          } catch {}
        }
      } catch {
        if (!abort && clerkUser?.firstName) {
          setFirstName(clerkUser.firstName);
        }
      }
    })();

    return () => {
      abort = true;
    };
  }, [getToken, clerkUser?.firstName]);

  // تعريف معلومات الصفحة
  const pageInfo = {
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Overview",
      img: imgZaytoona,
    },
    "/lesson": {
      title: "Lesson",
      subtitle: "Manage your app",
      img: imgLessonPage,
    },
    "/vocabsNotebook": {
      title: "Vocabs notebook",
      subtitle: "Your details",
      img: imgLessonPage,
    },
  };

  const current = pageInfo[location.pathname] || {
    title: "Welcome",
    subtitle: "Choose a page",
    img: imgZaytoona,
  };

  const handleLogout = async () => {
    try {
      setIsProfileOpen(false);
      await signOut({ redirectUrl: "/login" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <header className="header">
      {/* يسار */}
      <div className="header-left">
        <img src={current.img} alt="page-icon" className="page-icon" />
        <div>
          <h2 className="page-title">{current.title}</h2>
          <p className="page-subtitle">{current.subtitle}</p>
        </div>
      </div>

      {/* يمين */}
      <div className="header-right">
        {/* زر اللغة */}
        <button
          onClick={() => setLang(lang === "EN" ? "AR" : "EN")}
          className="lang-btn"
        >
          {lang}
        </button>

        {/* الإشعارات */}
        <div className="notification-wrapper">
          <img
            src={iconNotif}
            alt="notifications"
            className="notification-icon"
          />
          <span className="notification-badge">1</span>
        </div>

        {/* البروفايل */}
        <div className="profile-wrapper">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="profile-btn"
          >
            <img src={iconUserCircle} alt="profile" className="profile-img" />
            {/* ✅ الاسم الأول فقط من قاعدة البيانات */}
            <span className="profile-name">{firstName}</span>
            <img src={iconArrowDown} alt="arrow" className="arrow-down" />
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "ho" : "")}
                onClick={() => setIsProfileOpen(false)}
              >
                <div className="profile-setting">
                  <img
                    src={iconSetting}
                    alt="Setting"
                    className="setting-img"
                  />
                  <h5>Setting</h5>
                </div>
              </NavLink>

              <button
                type="button"
                className="profile-logout"
                onClick={handleLogout}
              >
                <img src={iconLogout} alt="Logout" className="setting-img" />
                <h5>Logout</h5>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

// Header.jsx — unified version (Clerk + Settings + ProfileDropdown + assets imports)

import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// ✅ Clerk (تسجيل خروج + التوكن)
import { useClerk, useAuth, useUser as useClerkUser } from "@clerk/clerk-react";

// ✅ لو بدك تحتفظي بكونتكستك المحلي للمستخدم (avatar مثلاً)
import { useUser as useLocalUser } from "../../context/UserContext";

// مكوناتك
import Settings from "./settings/Settings";
import ProfileDropdown from "./ProfileDropdown/ProfileDropdown";

// CSS
import "./header.css";

// ✅ استيراد صور/أيقونات كـ modules (يشتغل في build + PWA)
import imgZaytoona from "../../assets/images/zaytoonaReadingBook.png";
import imgLessonPage from "../../assets/images/lessonpage.png";
import iconNotif from "../../assets/icons/notification.svg";
import iconUserCircle from "../../assets/icons/User Circle.svg";
import iconArrowDown from "../../assets/icons/arrow-down.svg";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function Header() {
  const location = useLocation();

  // لغات + فتح القوائم
  const [lang, setLang] = useState("EN");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Clerk
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { user: clerkUser } = useClerkUser();

  // Context المحلي (لأفاتارك المخزن محلياً)
  const { user: localUser } = useLocalUser() || { user: {} };

  // الاسم المعروض (نجيب من DB أولاً، بعدين Clerk، بعدين Contextك)
  const [firstName, setFirstName] = useState(
    clerkUser?.firstName || localUser?.firstName || "User"
  );

  // 🔹 جلب الاسم من قاعدة البيانات (/api/me) مع تخزين محلي كـ fallback للأوفلاين
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, clerkUser?.firstName]);

  // 👇 تعريف معلومات الصفحات (حافظنا على صفحاتك)
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
    "/lessonSammary": {
      title: "Lesson Summary",
      subtitle: "Your details",
      img: imgLessonPage,
    },
  };

  const current = pageInfo[location.pathname] || {
    title: "Welcome",
    subtitle: "Choose a page",
    img: imgZaytoona,
  };

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

  // أفضل مصدر للأفاتار:
  const avatarSrc =
    localUser?.avatar || clerkUser?.imageUrl || iconUserCircle;

  return (
    <>
      <header className="header">
        {/* يسار: عنوان/صورة الصفحة */}
        <div className="header-left">
          <img src={current.img} alt="page-icon" className="page-icon" />
          <div className="page-texts">
            <h2 className="page-title">{current.title}</h2>
            <p className="page-subtitle">{current.subtitle}</p>
          </div>
        </div>

        {/* يمين: لغة + إشعارات + بروفايل */}
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
              <img src={avatarSrc} alt="profile" className="profile-img" />
              {/* الاسم الأول فقط */}
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

      {/* نافذة الإعدادات */}
      <Settings isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </>
  );
}

export default Header;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// 🔹 Clerk (تسجيل الدخول والمستخدم)
import { ClerkProvider } from "@clerk/clerk-react";

// 🔹 مزوّد المستخدم والثيم (من الماستر)
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";

// 🔹 تفعيل الـ PWA (تطبيق الويب التقدّمي)
import { registerSW } from "virtual:pwa-register";
registerSW({
  immediate: true,
  onRegistered: (r) => r && setTimeout(() => r.update(), 1000),
});

// 🔹 مفتاح Clerk من env
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        {/* 🔹 الآن كل الـ context (User + Theme) متاح داخل Clerk */}
        <UserProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </UserProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);

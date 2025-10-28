// /src/lib/realtime.js
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/**
 * يوصّل مع السيرفر ويُرجع Promise تحلّ بـ socket جاهز.
 * tokenProvider: دالة async ترجع توكن Clerk (أو null لو غير متاح).
 *   مثال: () => getToken()  أو  () => getToken({ template: "lexi-ws" })
 */
export async function connectRealtime(tokenProvider) {
    // 1) احصل على التوكن أول مرة
    let token = null;
    if (typeof tokenProvider === "function") {
        try {
            token = await tokenProvider();
        } catch (e) {
            console.warn("WS: tokenProvider() failed initially:", e?.message || e);
        }
    }

    if (token) {
        console.log("WS: using Clerk token", token.slice(0, 12) + "…");
    } else {
        console.warn(
            "WS: no token available — server must allow dev mode (SKIP_WS_AUTH=1) or token verification will fail."
        );
    }

    // 2) أنشئ السوكت (نمرّر التوكن إن وُجد)
    const s = io(API_BASE, {
        transports: ["websocket"],
        auth: token ? { token } : {},
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 600,
        timeout: 8000,
        path: "/socket.io", // لو عدّلتيه بالسيرفر، عدّليه هنا
    });

    // 3) قبل كل محاولة reconnect جرّب تحدّث التوكن
    s.io.on("reconnect_attempt", async (attempt) => {
        if (typeof tokenProvider !== "function") return;
        try {
            const fresh = await tokenProvider(); // ممكن تستخدمي getToken({ skipCache: true })
            if (fresh) {
                s.auth = { token: fresh }; // socket.io يقرأها في المحاولة التالية
                if (attempt === 1) {
                    console.log("WS: refreshed token for reconnect");
                }
            }
        } catch (e) {
            console.warn("WS: token refresh failed on reconnect:", e?.message || e);
        }
    });

    // 4) أعِد Promise تُحل عند الاتصال أو تُرفض عند الخطأ/مهلة
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            try { s.close(); } catch { }
            reject(new Error("WS connect timeout"));
        }, 9000);

        s.on("connect", () => {
            clearTimeout(timer);
            resolve(s);
        });

        s.on("connect_error", (e) => {
            clearTimeout(timer);
            console.error("WS connect_error:", e?.message || e);
            reject(e);
        });
    });
}

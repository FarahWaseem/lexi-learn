// /src/lib/realtime.js
import { io } from "socket.io-client";

/** يوصّل مع السيرفر ويُرجع socket جاهز */
export async function connectRealtime(getToken) {
    // في التطوير SKIP_WS_AUTH=1، لا نرسل توكن
    let auth = {};
    try {
        const token = getToken ? await getToken() : null;
        if (token) auth = { token };
    } catch { }

    const s = io("http://localhost:4000", {
        transports: ["websocket"],
        auth,
        withCredentials: true,
    });

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("WS connect timeout")), 8000);
        s.on("connect", () => {
            clearTimeout(timer);
            resolve(s);
        });
        s.on("connect_error", (e) => {
            clearTimeout(timer);
            reject(e);
        });
    });
}

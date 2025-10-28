import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";

export default function AutoUpsert() {
    const { isSignedIn, getToken } = useAuth();
    const called = useRef(false);

    useEffect(() => {
        if (!isSignedIn || called.current) return;
        called.current = true;

        (async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const url = "http://localhost:3001/api/me";
                console.log(
                    "🔸 calling",
                    url,
                    "with token:",
                    token.slice(0, 12) + "..."
                );

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res
                    .json()
                    .catch(async () => ({ raw: await res.text() }));
                console.log("✅ /api/me response:", res.status, data);
            } catch (e) {
                console.error("upsert failed", e);
            }
        })();
    }, [isSignedIn, getToken]);

    return null;
}

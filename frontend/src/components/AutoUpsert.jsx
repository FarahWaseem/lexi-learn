// src/components/AutoUpsert.jsx
import React, { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";

function AutoUpsert() {
    const { isSignedIn, getToken } = useAuth();
    const calledRef = useRef(false);

    useEffect(() => {
        if (!isSignedIn) return;
        if (calledRef.current) return; // امنعي التكرار
        calledRef.current = true;

        (async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const url = "http://127.0.0.1:3001/api/me";
                console.log(
                    "🔸 calling",
                    url,
                    "with token:",
                    token.slice(0, 12) + "..."
                );

                const res = await fetch(url, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    console.log("✅ /api/me ok:", data);
                } catch {
                    console.warn("⚠️ /api/me non-JSON:", text);
                }
            } catch (e) {
                console.error("upsert failed", e);
            }
        })();
    }, [isSignedIn, getToken]);

    return null;
}

export default AutoUpsert;

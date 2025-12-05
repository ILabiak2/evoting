// app/after-auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AfterAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        const isProd = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_NODE_ENV === "production";

        let cookieStr = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 15}; samesite=lax`;

        if (isProd) {
          cookieStr += "; secure"; // Only send over HTTPS in production
        }
        document.cookie = cookieStr;
      }

      try {
        const res = await fetch("/api/server/auth/me", {
          method: "GET",
          credentials: "include", // Важливо для куки!
        });

        if (!res.ok) {
          throw new Error("Неавторизований доступ");
        }
        const user = await res.json();
        console.log("🔐 Logged in user:", user);

        router.replace("/dashboard");
      } catch (err) {
        setError("Помилка входу. Спробуйте ще раз.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) return <p className="text-center mt-10">Завантаження...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    document.cookie = "access_token=; Path=/; Max-Age=0";
    
    router.push("/");
  }, [router]);

  return null;
}


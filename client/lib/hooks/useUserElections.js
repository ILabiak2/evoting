import { useQuery } from "@tanstack/react-query";

export const useUserElections = () => {
  return useQuery({
    queryKey: ["userElections"],
    queryFn: async () => {
      const res = await fetch("/api/server/election", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.message || "Failed to fetch elections.");
      }

      return res.json();
    },
  });
};
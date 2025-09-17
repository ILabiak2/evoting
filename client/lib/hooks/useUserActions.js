import { useQuery } from "@tanstack/react-query";

export const useUserActions = () => {
  return useQuery({
    queryKey: ["userActions"],
    queryFn: async () => {
      const res = await fetch(`/api/server/election/actions`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result?.message || "Failed to fetch user actions.");
      }

      return res.json();
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
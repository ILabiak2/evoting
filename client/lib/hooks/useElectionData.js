import { useQuery } from "@tanstack/react-query";

export const useElectionData = (address) => {
  return useQuery({
    queryKey: ["election", address],
    queryFn: async () => {
      const res = await fetch(`/api/server/election/${address}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.message || "Failed to fetch election.");
      }

      return res.json();
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
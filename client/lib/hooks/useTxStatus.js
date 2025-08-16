import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useTxStatus = (txHash, electionAddress) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["election-status", txHash],
    queryFn: async () => {
      if (!txHash) throw new Error("No transaction hash provided");
      const res = await fetch(`/api/server/election/status/${txHash}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    enabled: !!txHash,
    refetchInterval: (query) => {
      if (!query.state.data?.confirmed) return 7000;
      return false;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (query.data?.confirmed && electionAddress) {
      qc.invalidateQueries({
        queryKey: ["election", electionAddress],
        exact: true,
      });
    }
  }, [query.data?.confirmed, electionAddress, qc]);

  return query;
};

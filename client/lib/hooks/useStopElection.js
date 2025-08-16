import { useMutation } from "@tanstack/react-query";

export const useStopElection = () => {
  return useMutation({
    mutationFn: async ({ address }) => {
      if (!address) throw new Error("Missing election address");

      const res = await fetch(`/api/server/election/${address}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let message = "Failed to stop election.";
        try {
          const data = await res.json();
          message = data?.message || message;
        } catch {}
        throw new Error(message);
      }

      return res.json();
    },
  });
};

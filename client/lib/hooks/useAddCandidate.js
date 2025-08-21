import { useMutation } from "@tanstack/react-query";

export const useAddCandidate = () => {
  return useMutation({
    mutationFn: async ({ address, candidateNames }) => {
      if (!address) throw new Error("Missing election address");
      if (
        candidateNames === undefined ||
        candidateNames === null ||
        candidateNames.length < 1
      ) {
        throw new Error("Missing candidate name");
      }
      candidateNames.map((name) => {
        if (!name.trim()) throw new Error("Name cannot be empty");
      });

      const res = await fetch(`/api/server/election/${address}/candidates`, {
        method: "Post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateNames }),
      });

      if (!res.ok) {
        let msg = "Failed to add candidate.";
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
  });
};

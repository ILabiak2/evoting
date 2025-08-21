import { useMutation } from "@tanstack/react-query";

export const useDeleteCandidate = () => {
  return useMutation({
    mutationFn: async ({ address, candidateId }) => {
      if (!address) throw new Error("Missing election address");
      if (candidateId === undefined || candidateId === null) {
        throw new Error("Missing candidate id");
      }

      const res = await fetch(
        `/api/server/election/${address}/candidates/${candidateId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let msg = "Failed to delete candidate.";
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

import { useMutation } from "@tanstack/react-query";

export const useEditCandidateName = () => {
  return useMutation({
    mutationFn: async ({ address, candidateId, newName }) => {
      if (!address) throw new Error("Missing election address");
      if (candidateId === undefined || candidateId === null) {
        throw new Error("Missing candidate id");
      }
      if (!newName?.trim()) throw new Error("Name cannot be empty");

      const res = await fetch(
        `/api/server/election/${address}/candidates/edit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId, newName }),
        }
      );

      if (!res.ok) {
        let msg = "Failed to update candidate name.";
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

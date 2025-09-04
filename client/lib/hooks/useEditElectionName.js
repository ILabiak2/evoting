import { useMutation } from "@tanstack/react-query";

export const useEditElectionName = () => {
  return useMutation({
    mutationFn: async ({ address, newName }) => {
      if (!address) throw new Error("Missing election address");
      if (!newName?.trim()) throw new Error("Name cannot be empty");

      const res = await fetch(`/api/server/election/${address}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      });

      if (!res.ok) {
        let msg = "Failed to edit election name.";
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

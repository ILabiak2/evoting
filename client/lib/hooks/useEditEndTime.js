import { useMutation } from "@tanstack/react-query";

export const useEditEndTime = () => {
  return useMutation({
    mutationFn: async ({ address, newEndTime }) => {
      if (!address) throw new Error("Missing election address");
      if (newEndTime === undefined || newEndTime === null) {
        throw new Error("End time cannot be empty");
      }

      const res = await fetch(`/api/server/election/${address}/end-time`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEndTime }),
      });

      if (!res.ok) {
        let msg = "Failed to edit election end time.";
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

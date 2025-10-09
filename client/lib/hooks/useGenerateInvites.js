import { useMutation } from "@tanstack/react-query";

export const useGenerateInvites = () => {
    return useMutation({
      mutationFn: async ({ electionAddress, quantity }) => {
        const res = await fetch(`/api/server/election/${electionAddress}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
  
        if (!res.ok) {
          let message = "Failed to generate invites.";
          try {
            const result = await res.json();
            message = result?.message || message;
          } catch {
          }
          throw new Error(message);
        }
  
        return res.json();
      },
    });
  };
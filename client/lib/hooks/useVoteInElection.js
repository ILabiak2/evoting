import { useMutation } from "@tanstack/react-query";

export const useVoteInElection = () => {
  return useMutation({
    mutationFn: async ({ address, voteData }) => {
      if (!address) throw new Error("Missing election address");

      const res = await fetch(`/api/server/election/${address}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voteData),
      });

      if (!res.ok) {
        let err = "Failed to submit vote:\n";
        try {
          const result = await res.json();
          if (Array.isArray(result?.message) && result?.message[0]) {
            err +=
              typeof result.message[0] === "string"
                ? result.message.join(", ")
                : `${result.message[0]}`;
          } else if (typeof result?.message === "string") {
            err += result.message;
          }
        } catch {
        }
        throw new Error(err);
      }

      return res.json();
    },
  });
};

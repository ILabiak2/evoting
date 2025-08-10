import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useJoinPublicElection = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (address) => {
      if (!address) throw new Error("Missing election address");
      const res = await fetch(`/api/server/election/${address}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let message = "Failed to join election.";
        try {
          const data = await res.json();
          message = data?.message || message;
        } catch {}
        throw new Error(message);
      }
      return res.json(); // { joined: true }
    },
    onSuccess: (_data, address) => {
      //   qc.invalidateQueries({ queryKey: ["userElections"] });
      qc.invalidateQueries({ queryKey: ["election", address] });
    },
  });
};

export const useJoinPrivateElection = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode) => {
      if (!inviteCode) throw new Error("Missing invite code");
      const res = await fetch(`/api/server/election/join-with-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });

      if (!res.ok) {
        let message = "Failed to join election.";
        try {
          const data = await res.json();
          message = data?.message || message;
        } catch {}
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userElections"] });
    },
  });
};

export const useLeavePublicElection = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (address) => {
      if (!address) throw new Error("Missing election address");
      const res = await fetch(`/api/server/election/${address}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let message = "Failed to leave election.";
        try {
          const data = await res.json();
          message = data?.message || message;
        } catch {}
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: (_data, address) => {
      qc.invalidateQueries({ queryKey: ["election", address] });
    },
  });
};

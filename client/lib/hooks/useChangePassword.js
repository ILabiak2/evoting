import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useChangePassword = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      if (!currentPassword) throw new Error("Missing current password");
      if (!newPassword) throw new Error("Missing new password");

      const res = await fetch("/api/server/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        let message = "Failed to change password.";
        try {
          const data = await res.json();
          if (data?.details && Array.isArray(data.details)) {
            message = `${data?.message || message}: ${data.details.join("; ")}`;
          } else {
            message = data?.message || message;
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

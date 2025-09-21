"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useChangePassword } from "@/lib/hooks/useChangePassword";
import { MobileMenuButton } from "@/components/ui/mobile-menu-button";

export default function Settings() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePassword = useChangePassword();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full w-full p-6">
        <div className="text-center text-neutral-600 dark:text-neutral-300">
          Please sign in to view settings
        </div>
      </div>
    );
  }

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  const initials = (() => {
    const name = user.name || user.email || "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  })();

  const onSubmitChangePassword = async (e) => {
    e?.preventDefault?.();
    setFormError(null);
    setSuccessMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("New password and confirmation do not match.");
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setSuccessMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err?.message || "Failed to change password";
      if (err?.message && err.message.includes("{")) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed?.details && Array.isArray(parsed.details)) {
            setFormError(parsed.details.join("; "));
            return;
          }
        } catch (_) {}
      }
      setFormError(msg);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex h-full w-full flex-1 overflow-auto flex-col gap-2 border-neutral-200 bg-white p-4 md:p-10 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="max-w-3xl w-full mx-auto">
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            Profile settings
          </h1>
          <div className="flex md:hidden">
            <MobileMenuButton />
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Manage your profile and account settings
          </p>

          <div className="relative rounded-2xl border p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800">
            <GlowingEffect
              blur={0}
              borderWidth={1}
              spread={24}
              glow={false}
              disabled={true}
              proximity={64}
              inactiveZone={0.01}
            />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-28 w-28 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black text-white dark:bg-white dark:text-black">
                      <span className="font-medium">{initials}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold truncate text-neutral-900 dark:text-neutral-100">
                        {user.name || user.email}
                      </h2>
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* <div className="flex-shrink-0">
                    <button
                      onClick={() => (window.location.href = "/account/edit")}
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Edit profile
                    </button>
                  </div> */}
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-md border bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-800">
                    <div className="text-xs text-muted-foreground">
                      Public address
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className="font-mono text-sm truncate max-w-xs"
                        title={user.public_address}
                      >
                        {user.public_address}
                      </div>
                      <button
                        onClick={() => handleCopy(user.public_address)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Copy className="h-4 w-4" />
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-md border bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-800">
                    <div className="text-xs text-muted-foreground">Joined</div>
                    <div className="mt-1 text-sm">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </div>

                {user.provider === "email" && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                      Change password
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      To change your password enter current password and choose
                      a new one.
                    </p>

                    {formError && (
                      <div className="mb-3 text-sm text-red-600">
                        {formError}
                      </div>
                    )}
                    {successMsg && (
                      <div className="mb-3 text-sm text-green-600">
                        {successMsg}
                      </div>
                    )}

                    <form
                      onSubmit={onSubmitChangePassword}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <div className="col-span-1">
                        <label className="text-xs text-muted-foreground">
                          Current password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrent ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-neutral-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
                          >
                            {showCurrent ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <label className="text-xs text-muted-foreground">
                          New password
                        </label>
                        <div className="relative">
                          <input
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-neutral-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
                          >
                            {showNew ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <label className="text-xs text-muted-foreground">
                          Repeat new password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-neutral-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
                          >
                            {showConfirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1 flex items-end">
                        <button
                          type="submit"
                          disabled={changePassword.isLoading}
                          className={`w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${
                            changePassword.isLoading
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          {changePassword.isLoading && (
                            <svg
                              className="animate-spin h-4 w-4 text-gray-600 dark:text-gray-300"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                          )}
                          <span>
                            {changePassword.isLoading
                              ? "Saving..."
                              : "Change password"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React from "react";
import ProtectedRoute from "@/app/context/ProtectedRoute";
import Sidebar from "@/components/app-sidebar";
import Profile from "@/components/profile";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <>
        <Sidebar>
          <Profile />
        </Sidebar>
      </>
    </ProtectedRoute>
  );
}

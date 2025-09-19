"use client";
import React from "react";
import ProtectedRoute from "@/app/context/ProtectedRoute";
import Sidebar from "@/components/app-sidebar";
import Settings from "@/components/settings";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <>
        <Sidebar>
          <Settings />
        </Sidebar>
      </>
    </ProtectedRoute>
  );
}

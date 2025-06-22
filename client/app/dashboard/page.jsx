"use client"
import React, { useState, } from 'react';
import ProtectedRoute from '@/app/context/ProtectedRoute';
import Sidebar from '@/components/app-sidebar'
import Dashboard from '@/components/dashboard';
import { cn } from "@/lib/utils";


export default function Home() {

    return (
        <ProtectedRoute>
            <div>
                {/* <Navbar /> */}
                <Sidebar>
                    <Dashboard />
                </Sidebar>
            </div>
        </ProtectedRoute>
    );
}

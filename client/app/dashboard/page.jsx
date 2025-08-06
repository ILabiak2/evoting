"use client"
import React from 'react';
import ProtectedRoute from '@/app/context/ProtectedRoute';
import Sidebar from '@/components/app-sidebar'
import Dashboard from '@/components/dashboard';


export default function DashboardPage() {

    return (
        <ProtectedRoute>
            <div>
                <Sidebar>
                    <Dashboard />
                </Sidebar>
            </div>
        </ProtectedRoute>
    );
}

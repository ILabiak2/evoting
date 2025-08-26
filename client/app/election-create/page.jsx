"use client"
import React from 'react';
import ProtectedRoute from '@/app/context/ProtectedRoute';
import Sidebar from '@/components/app-sidebar'
import AddElection from "@/components/add-election"


export default function CreateElection() {
    return (
        <ProtectedRoute requiredRole={'creator'}>
            <Sidebar>
                <AddElection />
            </Sidebar>
        </ProtectedRoute>
    );
}

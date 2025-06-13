"use client"
import React, { useState, } from 'react';
import ProtectedRoute from '@/app/context/ProtectedRoute';
import SignupForm from '@/components/signup-form';
import { Navbar } from '@/components/navbar';
import { cn } from "@/lib/utils";


export default function Home() {

    return (
        <ProtectedRoute>
            <div>
                <Navbar />
            </div>
        </ProtectedRoute>
    );
}

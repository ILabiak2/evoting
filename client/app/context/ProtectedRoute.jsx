
'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, requiredRole = null }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/');
            } else if (requiredRole && user.role !== requiredRole) {
                router.replace('/'); 
                // router.replace('/unauthorized'); 
            }
        }
    }, [loading, user, router, requiredRole]);

    if (loading || !user || (requiredRole && user.role !== requiredRole)) {
        return null;
    }

    return children;
}
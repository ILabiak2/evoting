
import { notFound } from 'next/navigation';
import ProtectedRoute from '@/app/context/ProtectedRoute';
import Sidebar from '@/components/app-sidebar'
import ElectionView from '@/components/election-view'

export default async function ElectionPage({ params }) {
  const { address } = params;

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <div>
            <Sidebar>
                <ElectionView address={address} />
            </Sidebar>
        </div>
    </ProtectedRoute>
);
}
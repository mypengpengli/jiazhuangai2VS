'use client'; // ProtectedRoute is a client component

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute'; // Import the ProtectedRoute component

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* You can add admin-specific layout elements here if needed, e.g., a sidebar */}
        {children}
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
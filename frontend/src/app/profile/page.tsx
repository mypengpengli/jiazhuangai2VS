'use client'; // Needs client hooks for ProtectedRoute and useAuth

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

function ProfileContent() {
  // This content will only be rendered if the user is authenticated
  // because it's wrapped by ProtectedRoute below.
  const { user, token } = useAuth(); // Get user info and token from context

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">个人资料</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <p className="mb-4">欢迎回来！这里是受保护的个人资料页面。</p>
        {user ? (
          <div>
            <p><strong>用户名:</strong> {user.username}</p>
            <p><strong>用户 ID:</strong> {user.id}</p>
            {/* Add more user details if available */}
          </div>
        ) : (
          <p>正在加载用户信息...</p>
          // Or display a message if user data couldn't be fetched
        )}
        <p className="mt-4 text-xs break-all"><strong>Token:</strong> {token ? `${token.substring(0, 30)}...` : 'N/A'}</p>
      </div>
    </div>
  );
}

// The actual page component wraps the content with ProtectedRoute
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
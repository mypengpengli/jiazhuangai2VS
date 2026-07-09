'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type ProfileResponse = {
  id: number;
  username: string;
  display_name: string | null;
  bio: string | null;
  role: string;
  created_at: string;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';

const ProfilePage = () => {
  const { token, user, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchProfile = async () => {
      setIsFetching(true);
      setError(null);

      try {
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || '获取个人资料失败');
        }

        setProfile(data);
        setDisplayName(data.display_name || data.username || '');
        setBio(data.bio || '');
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err instanceof Error ? err.message : '获取个人资料失败');
      } finally {
        setIsFetching(false);
      }
    };

    void fetchProfile();
  }, [isLoading, router, token]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          bio,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || '保存个人资料失败');
      }

      setProfile(data);
      setDisplayName(data.display_name || data.username || '');
      setBio(data.bio || '');
      await refreshUser();
      setSuccess('个人资料已保存');
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err instanceof Error ? err.message : '保存个人资料失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-2xl border border-white/80 bg-white/70 px-6 py-4 text-sm text-slate-500 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          加载个人资料...
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-sky-600">账号设置</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">我的资料</h1>
        <p className="mt-2 text-sm text-slate-500">
          登录名用于识别账号，不能修改；昵称会用于评论区和页面展示。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/80 bg-white/75 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">登录名</label>
              <input
                value={profile?.username || user.username}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
              />
              <p className="mt-2 text-xs text-slate-400">登录 ID 不支持修改，避免评论归属和后台权限混乱。</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="display_name">
                显示昵称
              </label>
              <input
                id="display_name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={40}
                className="w-full rounded-xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-800 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                placeholder="比如：加装AI读者"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>为空时会显示登录名</span>
                <span>{displayName.trim().length}/40</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="bio">
                个人简介
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={200}
                rows={5}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white/85 px-4 py-3 text-sm leading-6 text-slate-800 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                placeholder="简单介绍一下你关注的 AI 方向..."
              />
              <div className="mt-2 text-right text-xs text-slate-400">{bio.trim().length}/200</div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存资料'}
            </button>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
              >
                进入管理后台
              </Link>
            )}
          </div>
        </form>

        <aside className="rounded-2xl border border-white/80 bg-white/65 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-xl font-bold text-white shadow-lg shadow-cyan-500/20">
            {(displayName || profile?.username || user.username || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">当前显示</p>
              <p className="mt-1 font-semibold text-slate-800">{displayName || profile?.username || user.username}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">角色</p>
              <p className="mt-1 font-medium text-slate-700">{profile?.role || user.role || 'user'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">用户 ID</p>
              <p className="mt-1 font-mono text-xs text-slate-600">{profile?.id || user.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-full border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
          >
            退出登录
          </button>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;

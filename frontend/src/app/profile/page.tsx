'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound, LogOut, PencilLine, ShieldCheck, UserRound } from 'lucide-react';
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

export default function ProfilePage() {
  const { token, user, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchProfile = async () => {
      setIsFetching(true);
      try {
        const response = await fetch(`${backendUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || '获取个人资料失败');
        setProfile(data);
        setDisplayName(data.display_name || data.username || '');
        setBio(data.bio || '');
      } catch (error) {
        setNotice({ tone: 'error', text: error instanceof Error ? error.message : '获取个人资料失败' });
      } finally {
        setIsFetching(false);
      }
    };
    void fetchProfile();
  }, [isLoading, router, token]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setIsSavingProfile(true);
    setNotice(null);
    try {
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ display_name: displayName, bio }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || '保存个人资料失败');
      setProfile(data);
      setDisplayName(data.display_name || data.username || '');
      setBio(data.bio || '');
      await refreshUser();
      setNotice({ tone: 'success', text: '个人资料已保存。' });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : '保存个人资料失败' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (nextPassword.length < 8) {
      setNotice({ tone: 'error', text: '新密码至少需要 8 个字符。' });
      return;
    }
    setIsSavingPassword(true);
    setNotice(null);
    try {
      const response = await fetch(`${backendUrl}/api/auth/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, next_password: nextPassword }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || '修改密码失败');
      setCurrentPassword('');
      setNextPassword('');
      setNotice({ tone: 'success', text: '密码已更新。' });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : '修改密码失败' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const leave = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || isFetching) return <div className="page-shell flex min-h-[55vh] items-center justify-center text-sm text-slate-500">正在加载账户资料...</div>;
  if (!token || !user) return null;

  const publicName = displayName || profile?.username || user.username;
  const isAdmin = (profile?.role || user.role) === 'admin';

  return <div className="page-shell py-8 sm:py-12">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-brand">账户设置</p><h1 className="mt-1 text-3xl font-bold text-slate-950">我的资料</h1><p className="mt-2 text-sm text-slate-500">显示昵称用于评论和页面展示；登录 ID 保持不变。</p></div>
      {isAdmin && <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 rounded-control border border-amber-200 bg-amber-50 px-3.5 text-sm font-medium text-amber-800 hover:bg-amber-100"><ShieldCheck className="size-4" />管理后台</Link>}
    </div>
    {notice && <div role="status" className={`mb-5 flex items-center gap-2 rounded-control border px-4 py-3 text-sm ${notice.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}><CheckCircle2 className="size-4 shrink-0" />{notice.text}</div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
      <div className="space-y-5">
        <form onSubmit={saveProfile} className="surface-card p-5 sm:p-6"><div className="mb-6 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-control bg-sky-50 text-brand"><PencilLine className="size-4" /></span><div><h2 className="font-bold text-slate-900">公开资料</h2><p className="text-sm text-slate-500">控制其他访客看到的称呼和简介。</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">登录 ID<input value={profile?.username || user.username} readOnly className="mt-2 h-11 w-full cursor-not-allowed rounded-control border border-slate-200 bg-slate-50 px-3 text-slate-500" /></label><label className="block text-sm font-medium text-slate-700">显示昵称<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} className="mt-2 h-11 w-full rounded-control border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-sky-100" placeholder="例如：加装AI读者" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{displayName.trim().length}/40</span></label></div>
          <label className="mt-1 block text-sm font-medium text-slate-700">个人简介<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={200} rows={4} className="mt-2 w-full resize-y rounded-control border border-slate-200 bg-white px-3 py-2.5 leading-6 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-sky-100" placeholder="简单介绍你关注的 AI 方向..." /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{bio.trim().length}/200</span></label>
          <button type="submit" disabled={isSavingProfile} className="mt-5 inline-flex min-h-10 items-center rounded-control bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">{isSavingProfile ? '正在保存...' : '保存资料'}</button>
        </form>
        <form onSubmit={changePassword} className="surface-card p-5 sm:p-6"><div className="mb-6 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-control bg-violet-50 text-violet-700"><KeyRound className="size-4" /></span><div><h2 className="font-bold text-slate-900">修改密码</h2><p className="text-sm text-slate-500">新密码至少 8 个字符；如有其他设备登录，请手动退出后重新登录。</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">当前密码<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required className="mt-2 h-11 w-full rounded-control border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-sky-100" /></label><label className="text-sm font-medium text-slate-700">新密码<input type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="mt-2 h-11 w-full rounded-control border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-sky-100" /></label></div>
          <button type="submit" disabled={isSavingPassword} className="mt-5 inline-flex min-h-10 items-center rounded-control border border-slate-200 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50">{isSavingPassword ? '正在更新...' : '更新密码'}</button>
        </form>
      </div>
      <aside className="surface-card h-fit p-5"><div className="flex size-12 items-center justify-center rounded-control bg-slate-900 text-lg font-bold text-white">{publicName.slice(0, 1).toUpperCase()}</div><h2 className="mt-4 flex items-center gap-2 font-bold text-slate-900"><UserRound className="size-4 text-brand" />{publicName}</h2><p className="mt-1 text-sm text-slate-500">{isAdmin ? '管理员' : '注册用户'}</p><dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm"><div><dt className="text-slate-400">用户 ID</dt><dd className="mt-1 font-mono text-xs text-slate-700">{profile?.id || user.id}</dd></div><div><dt className="text-slate-400">个人简介</dt><dd className="mt-1 leading-6 text-slate-700">{bio || '尚未填写'}</dd></div></dl><button type="button" onClick={leave} className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-rose-200 bg-rose-50 text-sm font-medium text-rose-700 hover:bg-rose-100"><LogOut className="size-4" />退出登录</button></aside>
    </div>
  </div>;
}

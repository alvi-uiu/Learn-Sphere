
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { AppView, User } from '../types';
import { Layout as DashboardIcon, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface AuthProps {
  view: AppView.LOGIN | AppView.REGISTER;
  onAuthSuccess: (user: User) => void;
  onSwitchView: (view: AppView) => void;
}

import { db } from '../services/db';
import { useToast } from '../components/Toast';

export const AuthView: React.FC<AuthProps> = ({ view, onAuthSuccess, onSwitchView }) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let user: User;
      if (view === AppView.LOGIN) {
        user = await db.login({ email, password });
      } else {
        user = await db.register({ name, email, password });
      }
      showToast(`Welcome back, ${user.name}!`, 'success');
      onAuthSuccess(user);
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-apple-blue/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 apple-gradient rounded-3xl flex items-center justify-center shadow-2xl mb-4">
            <DashboardIcon size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">LearnSphere</h1>
          <p className="text-gray-500 mt-2">Elevating academic collaboration</p>
        </div>

        <GlassCard className="p-8 border-white/10">
          <h2 className="text-xl font-bold mb-6 text-center">
            {view === AppView.LOGIN ? 'Welcome Back' : 'Create an Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === AppView.REGISTER && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">University Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full apple-gradient py-3 rounded-xl font-bold text-sm shadow-lg shadow-apple-blue/30 mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  {view === AppView.LOGIN ? 'Sign In' : 'Sign Up'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <button
              onClick={() => onSwitchView(view === AppView.LOGIN ? AppView.REGISTER : AppView.LOGIN)}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {view === AppView.LOGIN ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-gray-600 px-4">
                By continuing, you agree to LearnSphere's Academic Honor Code and Terms of Service.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

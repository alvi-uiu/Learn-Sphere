
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { 
  Users, BookOpen, MessageSquare, AlertTriangle, ShieldCheck, 
  Search, Filter, CheckCircle2, XCircle, MoreVertical,
  ArrowUpRight, Activity, Database
} from 'lucide-react';

const DATA = [
  { name: 'Mon', active: 400, posts: 240, cpu: 12 },
  { name: 'Tue', active: 300, posts: 139, cpu: 15 },
  { name: 'Wed', active: 600, posts: 980, cpu: 45 },
  { name: 'Thu', active: 800, posts: 390, cpu: 32 },
  { name: 'Fri', active: 700, posts: 480, cpu: 28 },
  { name: 'Sat', active: 500, posts: 380, cpu: 14 },
  { name: 'Sun', active: 650, posts: 430, cpu: 18 },
];

const MOCK_USERS = [
  { id: '1', name: 'John Doe', email: 'john@uni.edu', role: 'Student', status: 'Active', joined: 'Oct 12, 2023' },
  { id: '2', name: 'Dr. Jane Smith', email: 'jane@faculty.uni.edu', role: 'Professor', status: 'Verified', joined: 'Sep 05, 2023' },
  { id: '3', name: 'Bob Wilson', email: 'bob@uni.edu', role: 'Student', status: 'Flagged', joined: 'Nov 20, 2023' },
  { id: '4', name: 'Alice Chen', email: 'alice@uni.edu', role: 'Student', status: 'Active', joined: 'Dec 01, 2023' },
];

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'moderation'>('analytics');

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-500/5">
            <ShieldCheck className="text-green-500" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">System Admin</h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Infrastructure Hub • Node: US-EAST-1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 glass border-white/5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-apple-blue text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <Activity size={14} className="inline mr-2" /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-apple-blue text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <Users size={14} className="inline mr-2" /> Users
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'moderation' ? 'bg-apple-blue text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <AlertTriangle size={14} className="inline mr-2" /> Moderation
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Sessions', value: '4,129', icon: Activity, color: 'text-blue-400', trend: '+12.4%' },
              { label: 'Database Calls', value: '1.2M', icon: Database, color: 'text-purple-400', trend: '+5.1%' },
              { label: 'AI Tokens / hr', value: '84k', icon: MessageSquare, color: 'text-indigo-400', trend: '+31.2%' },
              { label: 'Safety Score', value: '99.8%', icon: ShieldCheck, color: 'text-green-400', trend: 'Stable' },
            ].map((stat, i) => (
              <GlassCard key={i} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-widest">{stat.label}</p>
                    <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.color.replace('text', 'bg')}/10`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-white/10 text-gray-400'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-[10px] text-gray-500">vs yesterday</span>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold">Engagement Velocity</h3>
                  <p className="text-xs text-gray-500 mt-1">Daily interaction metrics across services</p>
                </div>
                <ArrowUpRight size={20} className="text-apple-blue" />
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DATA}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111" />
                    <XAxis dataKey="name" stroke="#444" fontSize={11} />
                    <YAxis stroke="#444" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="active" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                    <Area type="monotone" dataKey="posts" stroke="#5856D6" strokeWidth={3} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold">System Load (CPU %)</h3>
                  <p className="text-xs text-gray-500 mt-1">Real-time compute utilization</p>
                </div>
                <Database size={20} className="text-purple-400" />
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111" />
                    <XAxis dataKey="name" stroke="#444" fontSize={11} />
                    <YAxis stroke="#444" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    />
                    <Bar dataKey="cpu" fill="#5856D6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <GlassCard className="overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold">Member Management</h3>
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="text" placeholder="Search users..." className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue/50" />
                 </div>
                 <button className="p-2 glass border-white/10 rounded-xl hover:bg-white/10"><Filter size={16} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_USERS.map(user => (
                    <tr key={user.id} className="text-sm hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={`https://picsum.photos/seed/${user.id}/40/40`} className="w-8 h-8 rounded-xl border border-white/10" />
                          <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-[10px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${user.role === 'Professor' ? 'bg-purple-500/10 text-purple-400' : 'bg-apple-blue/10 text-apple-blue'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : user.status === 'Flagged' ? 'bg-orange-500' : 'bg-apple-blue'}`}></div>
                          <span className="text-xs font-medium">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{user.joined}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <GlassCard className="p-8 border-orange-500/20 bg-orange-500/5">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/30">
                 <AlertTriangle className="text-orange-500" size={28} />
               </div>
               <div>
                 <h3 className="text-xl font-bold">Content Safety Queue</h3>
                 <p className="text-xs text-orange-500/70 font-medium mt-1">3 items require immediate administrative review</p>
               </div>
             </div>

             <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-6 glass border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg font-bold">MISINFORMATION</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">12:45 PM • Post ID: 4920</span>
                      </div>
                      <p className="text-sm italic text-gray-400 mb-2">"Gravity is actually just a social construct invented by Big Physics to sell more gym memberships..."</p>
                      <p className="text-xs text-gray-600">Reported by: 12 users • Confidence Score: 94%</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all">
                        <XCircle size={14} /> Remove
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-all">
                        <CheckCircle2 size={14} /> Approve
                      </button>
                    </div>
                  </div>
                ))}
             </div>
           </GlassCard>
        </div>
      )}
    </div>
  );
};

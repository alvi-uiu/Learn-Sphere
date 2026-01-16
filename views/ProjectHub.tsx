
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
    Search, Filter, Plus, Lightbulb, Users, MessageCircle,
    Heart, Share2, Tag, ChevronRight, Briefcase, Target,
    Calendar, CheckCircle2, Clock, MoreVertical
} from 'lucide-react';
import { Project, AppView, User } from '../types';
import { useToast } from '../components/Toast';

interface ProjectHubProps {
    onViewProject: (projectId: string) => void;
    user: User | null;
}

export const ProjectHub: React.FC<ProjectHubProps> = ({ onViewProject, user }) => {
    const { showToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [stats, setStats] = useState({ totalProjects: 0, completedProjects: 0, totalParticipants: 0 });
    const [filter, setFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        trimester: 'Spring',
        year: new Date().getFullYear().toString(),
        tags: [] as string[],
        lookingFor: [] as string[],
        ownerStudentId: '',
        membersNeeded: 1
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/projects?t=${Date.now()}`);
            const data = await res.json();
            if (data.projects) {
                setProjects(data.projects);
                setStats(data.stats);
            } else {
                setProjects(data);
            }
        } catch (e) {
            console.error('Failed to fetch projects:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!user) {
            showToast('Please log in to create a project', 'error');
            return;
        }
        if (!newProject.title.trim() || !newProject.description.trim()) {
            showToast('Project title and description are required', 'warning');
            return;
        }

        try {
            console.log('Sending project data:', { ...newProject, userId: user.id });
            const res = await fetch('http://localhost:3001/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProject,
                    ownerId: user.id,
                    ownerName: user.name,
                    ownerAvatar: user.avatar,
                    ownerStudentId: newProject.ownerStudentId,
                    status: 'Open'
                })
            });
            if (res.ok) {
                showToast('Project created successfully!', 'success');
                setShowCreateModal(false);
                fetchProjects();
                setNewProject({
                    title: '',
                    description: '',
                    trimester: 'Spring',
                    year: new Date().getFullYear().toString(),
                    tags: [],
                    lookingFor: [],
                    ownerStudentId: '',
                    membersNeeded: 1
                });
            } else {
                const err = await res.json();
                showToast(`Error: ${err.error || 'Failed to create project'}`, 'error');
            }
        } catch (e) {
            console.error('Failed to create project:', e);
            showToast('Network error while creating project', 'error');
        }
    };

    const filteredProjects = projects.filter(p => {
        if (filter === 'All') return true;
        return p.status === filter;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Target className="text-apple-blue" size={32} />
                        Collaboration Hub
                    </h2>
                    <p className="text-gray-400 mt-2 max-w-xl">
                        Launch your ideas, build your dream team, and track your project's progress in real-time. Designed for university innovators.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="apple-gradient text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-apple-blue/20 flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Plus size={20} />
                    <span>New Project</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Projects</p>
                        <p className="text-2xl font-bold">{stats.totalProjects}</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Projects Completed</p>
                        <p className="text-2xl font-bold">{stats.completedProjects}</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Project Participants</p>
                        <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                    </div>
                </GlassCard>
            </div>

            {/* Filters */}
            <GlassCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {['All', 'Open', 'In Progress', 'Completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-white text-black' : 'text-gray-500 hover:bg-white/5'}`}
                        >
                            {f === 'Open' ? 'Hiring' : f}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue/50"
                    />
                </div>
            </GlassCard>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-64 glass animate-pulse rounded-3xl" />)
                ) : (
                    filteredProjects.map(project => (
                        <GlassCard key={project.id} className="p-0 overflow-hidden group hover:border-apple-blue/30 transition-all hover:shadow-2xl hover:shadow-apple-blue/5">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {[...Array(Math.min(3, project.memberCount || 0))].map((_, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-apple-blue/20 border border-white/10 flex items-center justify-center text-[8px] font-bold">
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                            ))}
                                            {(project.memberCount || 0) > 3 && (
                                                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold">
                                                    +{(project.memberCount || 0) - 3}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {project.memberCount || 0} members
                                        </span>
                                    </div>
                                </div>
                                <h3
                                    onClick={() => onViewProject(project.id)}
                                    className="font-bold text-xl leading-tight hover:text-apple-blue transition-colors cursor-pointer"
                                >
                                    {project.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    led by <span className="text-gray-300 font-medium">{project.ownerName}</span> • {project.trimester} {project.year}
                                </p>

                                <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed mt-4">
                                    {project.description}
                                </p>

                                {/* Progress Bar */}
                                <div className="mb-6 space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-gray-500">Project Progress</span>
                                        <span className="text-apple-blue">{project.percentage || 0}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${project.percentage || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center">
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${(project.memberCount || 0) >= (project.members_needed || 1)
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                }`}>
                                                {(project.memberCount || 0) >= (project.members_needed || 1) ? 'Team Full' : `Hiring ${project.members_needed - project.memberCount} more`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {project.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[10px] font-bold bg-white/5 text-gray-500 px-2.5 py-1 rounded-lg">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            {/* Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <GlassCard className="w-full max-w-xl p-8 border-white/10 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">Launch New Project</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Project Title</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-apple-blue"
                                    placeholder="e.g. AI Study Companion"
                                    value={newProject.title}
                                    onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-apple-blue"
                                    placeholder="What are you building?"
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Trimester</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm"
                                        value={newProject.trimester}
                                        onChange={e => setNewProject({ ...newProject, trimester: e.target.value })}
                                    >
                                        <option>Spring</option>
                                        <option>Summer</option>
                                        <option>Fall</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Year</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm"
                                        value={newProject.year}
                                        onChange={e => setNewProject({ ...newProject, year: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Tags (comma separated)</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm"
                                    placeholder="AI, Research, Mobile"
                                    onChange={e => setNewProject({ ...newProject, tags: e.target.value.split(',').map(t => t.trim()) })}
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Student ID</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-apple-blue outline-none"
                                            placeholder="e.g. 011211..."
                                            value={newProject.ownerStudentId}
                                            onChange={e => setNewProject({ ...newProject, ownerStudentId: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Members Needed</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-apple-blue outline-none"
                                            value={newProject.membersNeeded}
                                            onChange={e => setNewProject({ ...newProject, membersNeeded: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Looking For (comma separated)</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm"
                                        placeholder="Frontend Dev, Designer"
                                        onChange={e => setNewProject({ ...newProject, lookingFor: e.target.value.split(',').map(t => t.trim()) })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                <button onClick={handleCreateProject} className="flex-1 apple-gradient text-white px-6 py-3 rounded-xl font-bold">Create Project</button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

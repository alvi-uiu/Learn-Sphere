
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
    ChevronLeft, Users, CheckSquare, Activity, Plus,
    Calendar, Clock, MessageSquare, Shield, Rocket,
    CheckCircle2, Circle, AlertCircle, Trash2
} from 'lucide-react';
import { Project, ProjectTask, ProjectMember, ProjectUpdate, User } from '../types';

interface ProjectDetailProps {
    projectId: string;
    onBack: () => void;
    currentUser: User | null;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, currentUser }) => {
    const [project, setProject] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'applications'>('tasks');
    const [isLoading, setIsLoading] = useState(true);

    // Task creation state
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '' });

    // Project edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        membersNeeded: 1,
        trimester: 'Spring',
        year: '',
        tags: [] as string[],
        lookingFor: [] as string[]
    });

    // Application state
    const [applications, setApplications] = useState<any[]>([]);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [applyData, setApplyData] = useState({ studentId: '', phoneNumber: '', description: '' });
    const [isSubmittingApp, setIsSubmittingApp] = useState(false);

    useEffect(() => {
        fetchProjectDetails();
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/projects/${projectId}`);
            const data = await res.json();
            setProject(data);
            setEditData({
                title: data.title,
                description: data.description,
                membersNeeded: data.members_needed || 1,
                trimester: data.trimester,
                year: data.year,
                tags: data.tags || [],
                lookingFor: data.lookingFor || []
            });
            if (currentUser?.id === data.owner_id) {
                fetchApplications();
            }
        } catch (e) {
            console.error('Error fetching project details:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/projects/${projectId}/applications`);
            const data = await res.json();
            setApplications(data);
        } catch (e) {
            console.error('Error fetching applications:', e);
        }
    };

    const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Done' ? 'Todo' : 'Done';
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchProjectDetails(); // Refresh
        } catch (e) {
            console.error('Error updating task:', e);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}/tasks/${taskId}`, {
                method: 'DELETE'
            });
            fetchProjectDetails();
        } catch (e) {
            console.error('Error deleting task:', e);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) return;
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newTask,
                    assignedTo: currentUser?.id,
                    assignedName: currentUser?.name,
                    assignedAvatar: currentUser?.avatar
                })
            });
            setShowTaskForm(false);
            setNewTask({ title: '', description: '' });
            fetchProjectDetails();
        } catch (e) {
            console.error('Error adding task:', e);
        }
    };

    const updateProjectStatus = async (status: string) => {
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchProjectDetails();
        } catch (e) {
            console.error('Error updating project status:', e);
        }
    };

    const handleUpdateProject = async () => {
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            setIsEditing(false);
            fetchProjectDetails();
        } catch (e) {
            console.error('Error updating project:', e);
        }
    };

    const handleApply = async () => {
        if (!currentUser) return;
        setIsSubmittingApp(true);
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    userName: currentUser.name,
                    userAvatar: currentUser.avatar,
                    ...applyData
                })
            });
            setShowApplyForm(false);
            setApplyData({ studentId: '', phoneNumber: '', description: '' });
            alert('Application submitted successfully!');
        } catch (e) {
            console.error('Error applying:', e);
        } finally {
            setIsSubmittingApp(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!window.confirm('Remove this member from the team?')) return;
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}/members/${userId}`, {
                method: 'DELETE'
            });
            fetchProjectDetails();
        } catch (e) {
            console.error('Error removing member:', e);
        }
    };

    const handleManageApplication = async (appId: string, status: 'Accepted' | 'Rejected') => {
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}/applications/${appId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchApplications();
            fetchProjectDetails();
        } catch (e) {
            console.error('Error managing application:', e);
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
        try {
            await fetch(`http://localhost:3001/api/projects/${projectId}`, {
                method: 'DELETE'
            });
            onBack();
        } catch (e) {
            console.error('Error deleting project:', e);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 apple-gradient rounded-2xl animate-pulse" /></div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Nav */}
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm">Back to Hub</span>
            </button>

            {/* Project Header */}
            <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            {currentUser?.id === project.owner_id ? (
                                <select
                                    className="bg-apple-blue/10 text-apple-blue text-[10px] font-bold uppercase tracking-widest border border-apple-blue/20 rounded-full px-3 py-1 outline-none appearance-none"
                                    value={project.status}
                                    onChange={(e) => updateProjectStatus(e.target.value)}
                                >
                                    <option value="Open">Hiring</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            ) : (
                                <span className="px-3 py-1 rounded-full bg-apple-blue/10 text-apple-blue text-[10px] font-bold uppercase tracking-widest border border-apple-blue/20">
                                    {project.status === 'Open' ? 'Hiring' : project.status}
                                </span>
                            )}

                            {isEditing ? (
                                <div className="flex gap-2">
                                    <select
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase outline-none"
                                        value={editData.trimester}
                                        onChange={e => setEditData({ ...editData, trimester: e.target.value })}
                                    >
                                        <option>Spring</option>
                                        <option>Summer</option>
                                        <option>Fall</option>
                                    </select>
                                    <input
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold w-16 outline-none"
                                        value={editData.year}
                                        onChange={e => setEditData({ ...editData, year: e.target.value })}
                                        placeholder="Year"
                                    />
                                </div>
                            ) : (
                                <span className="text-gray-500 text-xs font-medium">{project.trimester} • {project.year}</span>
                            )}
                        </div>

                        {isEditing ? (
                            <input
                                className="text-4xl font-bold tracking-tight bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full outline-none focus:border-apple-blue/50"
                                value={editData.title}
                                onChange={e => setEditData({ ...editData, title: e.target.value })}
                            />
                        ) : (
                            <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
                        )}

                        {isEditing ? (
                            <textarea
                                className="text-gray-400 leading-relaxed w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-apple-blue/50 min-h-[120px]"
                                value={editData.description}
                                onChange={e => setEditData({ ...editData, description: e.target.value })}
                            />
                        ) : (
                            <p className="text-gray-400 leading-relaxed max-w-2xl text-lg">{project.description}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tags</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                                    value={editData.tags.join(', ')}
                                    onChange={e => setEditData({ ...editData, tags: e.target.value.split(',').map(t => t.trim()) })}
                                    placeholder="e.g. AI, Research, Mobile"
                                />
                            </div>
                        ) : (
                            project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tag: string, i: number) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )
                        )}

                        {isEditing ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Roles Needed</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none text-apple-blue"
                                    value={editData.lookingFor.join(', ')}
                                    onChange={e => setEditData({ ...editData, lookingFor: e.target.value.split(',').map(t => t.trim()) })}
                                    placeholder="e.g. UI Designer, Backend Dev"
                                />
                            </div>
                        ) : (
                            project.lookingFor && project.lookingFor.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2 items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-2">Hiring for:</span>
                                    {project.lookingFor.map((role: string, i: number) => (
                                        <span key={i} className="px-3 py-1 rounded-lg bg-apple-blue/10 border border-apple-blue/20 text-[10px] font-bold text-apple-blue">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-apple-blue/20 flex items-center justify-center text-apple-blue font-bold border border-apple-blue/30">
                                {project.ownerName?.charAt(0)}
                            </div>
                            <div className="text-xs">
                                <p className="text-gray-500 font-bold uppercase tracking-tighter">Owner</p>
                                <p className="font-semibold text-gray-200">{project.ownerName}</p>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="text-xs">
                            <p className="text-gray-500 font-bold uppercase tracking-tighter">Progress</p>
                            <p className="font-semibold text-apple-blue text-sm">{project.percentage}% Complete</p>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="text-xs">
                            <p className="text-gray-500 font-bold uppercase tracking-tighter">Days Active</p>
                            <p className="font-semibold text-green-400 text-sm">
                                {Math.max(1, Math.ceil((new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)))} Days
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 space-y-6">
                    <GlassCard className="p-6">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quick Stats</h4>
                                {currentUser?.id === project.owner_id && (
                                    <button
                                        onClick={() => isEditing ? handleUpdateProject() : setIsEditing(true)}
                                        className="text-[10px] font-bold text-apple-blue hover:underline uppercase tracking-widest"
                                    >
                                        {isEditing ? 'Save Changes' : 'Edit Project'}
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total Tasks</span>
                                    <span className="font-bold text-gray-200">{project.tasks.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Team Size</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-200">{project.members.length} /</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="w-12 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs outline-none focus:border-apple-blue"
                                                value={editData.membersNeeded}
                                                onChange={e => setEditData({ ...editData, membersNeeded: parseInt(e.target.value) || 1 })}
                                            />
                                        ) : (
                                            <span className="font-bold text-gray-200">{project.members_needed || 1}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Recruitment</span>
                                    <span className={`font-bold ${(project.members.length || 0) >= (project.members_needed || 1) ? 'text-green-400' : 'text-orange-400'}`}>
                                        {(project.members.length || 0) >= (project.members_needed || 1)
                                            ? 'Team Full'
                                            : `Hiring ${project.members_needed - project.members.length} more`}
                                    </span>
                                </div>
                            </div>
                            {isEditing ? (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="w-full bg-white/5 border border-white/10 text-gray-400 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                                >
                                    Cancel Edit
                                </button>
                            ) : currentUser?.id !== project.owner_id ? (
                                <button
                                    onClick={() => setShowApplyForm(true)}
                                    className="w-full apple-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-apple-blue/20 hover:scale-[1.02] transition-all"
                                >
                                    <Rocket size={18} />
                                    Apply for Project
                                </button>
                            ) : (
                                <button
                                    onClick={handleDeleteProject}
                                    className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/5"
                                >
                                    <Trash2 size={18} />
                                    Delete Project
                                </button>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                    { id: 'team', label: 'Team', icon: Users },
                    ...(currentUser?.id === project.owner_id ? [{ id: 'applications', label: 'Applications', icon: Users }] : [])
                ].map((tab: any) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-8 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-apple-blue rounded-full" />}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'tasks' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                            <span>Project Roadmap</span>
                            <span>{project.percentage}% Done</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700" style={{ width: `${project.percentage}%` }} />
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Planned Tasks</h3>
                            {currentUser?.id === project.owner_id && (
                                <button
                                    onClick={() => setShowTaskForm(!showTaskForm)}
                                    className="flex items-center gap-2 text-xs font-bold text-apple-blue hover:bg-apple-blue/10 px-3 py-1.5 rounded-lg transition-colors border border-apple-blue/30"
                                >
                                    <Plus size={16} /> New Task
                                </button>
                            )}
                        </div>

                        {showTaskForm && (
                            <GlassCard className="mb-6 p-4 border-apple-blue/20 bg-apple-blue/5">
                                <div className="space-y-4">
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm"
                                        placeholder="Task title..."
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    />
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm"
                                        placeholder="Brief description..."
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowTaskForm(false)} className="px-3 py-1.5 text-xs text-gray-500 font-bold">Cancel</button>
                                        <button onClick={handleAddTask} className="px-4 py-1.5 bg-apple-blue text-white rounded-lg text-xs font-bold">Add Task</button>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        <div className="space-y-3">
                            {project.tasks.length === 0 && (
                                <div className="text-center py-12 glass rounded-3xl border-dashed border-white/10">
                                    <AlertCircle className="mx-auto text-gray-600 mb-3" size={32} />
                                    <p className="text-gray-500 text-sm">No tasks created yet. Start planning!</p>
                                </div>
                            )}
                            {project.tasks.map((task: ProjectTask) => (
                                <GlassCard
                                    key={task.id}
                                    className={`p-4 flex items-center justify-between group transition-all ${task.status === 'Done' ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleTaskStatus(task.id, task.status)}
                                            className={`transition-colors ${task.status === 'Done' ? 'text-green-500' : 'text-gray-600 hover:text-gray-400'}`}
                                        >
                                            {task.status === 'Done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>
                                        <div>
                                            <h4 className={`font-bold text-sm ${task.status === 'Done' ? 'line-through' : ''}`}>{task.title}</h4>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{task.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {task.assignedAvatar && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500 font-medium">Assigned to</span>
                                                <img src={task.assignedAvatar} className="w-6 h-6 rounded-full" />
                                            </div>
                                        )}
                                        {(currentUser?.id === project.owner_id || currentUser?.id === task.assigned_to) && (
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {project.members && project.members.map((member: ProjectMember) => (
                            <GlassCard key={member.userId || Math.random()} className="p-5 flex items-center gap-4 relative group">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-bold border border-white/10">
                                    {(member.userName || '?').charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm tracking-tight">{member.userName || 'Unknown Member'}</h4>
                                    {member.student_id && (
                                        <p className="text-[10px] text-apple-blue font-bold tracking-widest mt-0.5">ID: {member.student_id}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${member.role === 'Leader' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-apple-blue/10 text-apple-blue border border-apple-blue/20'
                                            }`}>
                                            {member.role || 'Member'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Shield className={member.role === 'Leader' ? 'text-orange-500' : 'text-gray-700'} size={16} />
                                    {currentUser?.id === project.owner_id && member.role !== 'Leader' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-500 transition-all bg-red-500/10 rounded-lg border border-red-500/20"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
                {activeTab === 'applications' && currentUser?.id === project.owner_id && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold">Project Applications</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {applications.length === 0 && (
                                <div className="text-center py-12 glass rounded-3xl border-dashed border-white/10">
                                    <p className="text-gray-500">No applications yet.</p>
                                </div>
                            )}
                            {applications.map((app: any) => (
                                <GlassCard key={app.id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <img src={app.user_avatar} className="w-12 h-12 rounded-full" />
                                            <div>
                                                <h4 className="font-bold">{app.user_name}</h4>
                                                <p className="text-xs text-apple-blue font-bold uppercase tracking-widest mt-1">Student ID: {app.student_id}</p>
                                                <p className="text-gray-400 text-sm mt-3 leading-relaxed">{app.description}</p>
                                                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 font-medium">
                                                    <span>📞 {app.phone_number}</span>
                                                    <span>📅 {new Date(app.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {app.status === 'Pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleManageApplication(app.id, 'Accepted')}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleManageApplication(app.id, 'Rejected')}
                                                        className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-center ${app.status === 'Accepted' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Application Modal */}
            {showApplyForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <GlassCard className="w-full max-w-lg p-8 border-white/10 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-2">Apply for Project</h3>
                        <p className="text-gray-500 text-sm mb-6">Send your application to the project owner.</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Student ID</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-apple-blue outline-none"
                                        placeholder="e.g. 011211..."
                                        value={applyData.studentId}
                                        onChange={e => setApplyData({ ...applyData, studentId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-apple-blue outline-none"
                                        placeholder="+880..."
                                        value={applyData.phoneNumber}
                                        onChange={e => setApplyData({ ...applyData, phoneNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Why should we pick you?</label>
                                <textarea
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-apple-blue outline-none resize-none"
                                    placeholder="Tell the owner about your relevant skills and interest..."
                                    value={applyData.description}
                                    onChange={e => setApplyData({ ...applyData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button
                                    onClick={() => setShowApplyForm(false)}
                                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    disabled={isSubmittingApp}
                                    className="flex-1 apple-gradient text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:scale-[1.02] transition-all text-sm shadow-lg shadow-apple-blue/20"
                                >
                                    {isSubmittingApp ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

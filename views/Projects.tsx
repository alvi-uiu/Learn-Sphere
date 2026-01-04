
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
    Search, Filter, Plus, Lightbulb, Users, MessageCircle,
    Heart, Share2, Tag, ChevronRight, Briefcase
} from 'lucide-react';
import { Project } from '../types';

const MOCK_PROJECTS: Project[] = [
    {
        id: '1',
        title: 'EcoSort: AI Waste Classification',
        description: 'Developing a computer vision model to automatically sort recyclables from general waste in real-time. We need a frontend dev to build the dashboard!',
        author: 'David Kim',
        authorId: 'u4',
        avatar: 'https://picsum.photos/seed/david/80/80',
        tags: ['AI', 'Environment', 'React'],
        lookingFor: ['Frontend Dev', 'UI Designer'],
        likes: 342,
        comments: 45,
        status: 'In Progress',
        timestamp: '2d ago'
    },
    {
        id: '2',
        title: 'Mars Rover Simulate v2',
        description: 'An open-source physics simulation of the Martian surface. Looking for contributors to help with the gravity physics engine.',
        author: 'SpaceX Club',
        authorId: 'u5',
        avatar: 'https://picsum.photos/seed/spacex/80/80',
        tags: ['Physics', 'Simulation', 'C++'],
        lookingFor: ['Physics Engine Dev', '3D Modeler'],
        likes: 890,
        comments: 120,
        status: 'Open',
        timestamp: '5h ago'
    },
    {
        id: '3',
        title: 'StudyBuddy Mobile App',
        description: 'A React Native app to help students find study partners on campus based on their current location and subject.',
        author: 'Sarah Jenkins',
        authorId: 'u6',
        avatar: 'https://picsum.photos/seed/sarahj/80/80',
        tags: ['Mobile', 'Social', 'ReactNative'],
        lookingFor: ['Beta Testers', 'React Native Dev'],
        likes: 156,
        comments: 23,
        status: 'In Progress',
        timestamp: '1wk ago'
    }
];

export const ProjectsView: React.FC = () => {
    const [projects] = useState<Project[]>(MOCK_PROJECTS);
    const [filter, setFilter] = useState('All');

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Lightbulb className="text-yellow-400" size={32} />
                        Innovation Hub
                    </h2>
                    <p className="text-gray-400 mt-2 max-w-xl">
                        Discover, collaborate, and launch student-led projects. Find your next team or share your big idea with the campus.
                    </p>
                </div>
                <button className="apple-gradient text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-apple-blue/20 flex items-center gap-2 hover:scale-105 transition-transform">
                    <Plus size={20} />
                    <span>Launch Project</span>
                </button>
            </div>

            {/* Filters & Search */}
            <GlassCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {['All', 'Open for Collab', 'In Progress', 'Completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-white text-black' : 'text-gray-500 hover:bg-white/5'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search projects by tag or title..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue/50"
                        />
                    </div>
                    <button className="p-2 glass border-white/10 rounded-xl hover:bg-white/10 text-gray-400">
                        <Filter size={18} />
                    </button>
                </div>
            </GlassCard>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(project => (
                    <GlassCard key={project.id} className="p-0 overflow-hidden group hover:border-apple-blue/30 transition-colors">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={project.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt={project.author} />
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-apple-blue transition-colors cursor-pointer">{project.title}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">by {project.author} • {project.timestamp}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${project.status === 'Open' ? 'bg-green-500/10 text-green-500' :
                                        project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-gray-500/10 text-gray-400'
                                    }`}>
                                    {project.status === 'Open' ? 'Open for Collab' : project.status}
                                </span>
                            </div>

                            <p className="text-gray-300 text-sm mb-6 line-clamp-2">
                                {project.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {project.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 text-[10px] font-bold bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>

                            {project.lookingFor.length > 0 && (
                                <div className="mb-6 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Briefcase size={12} /> Looking For
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.lookingFor.map(role => (
                                            <span key={role} className="text-[10px] font-medium text-apple-blue bg-apple-blue/10 px-2 py-0.5 rounded-md border border-apple-blue/20">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/[0.02] border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-1.5 text-gray-500 hover:text-pink-500 transition-colors">
                                    <Heart size={16} /> <span className="text-xs font-bold">{project.likes}</span>
                                </button>
                                <button className="flex items-center gap-1.5 text-gray-500 hover:text-apple-blue transition-colors">
                                    <MessageCircle size={16} /> <span className="text-xs font-bold">{project.comments}</span>
                                </button>
                            </div>
                            <button className="flex items-center gap-2 text-xs font-bold text-white hover:text-apple-blue transition-colors">
                                View Details <ChevronRight size={14} />
                            </button>
                        </div>
                    </GlassCard>
                ))}

                {/* Call to Action Card */}
                <div className="rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center hover:border-white/20 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="text-gray-400 group-hover:text-white" size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-300 group-hover:text-white">Start a New Project</h3>
                    <p className="text-xs text-gray-500 max-w-xs mt-2">Have a brilliant idea? Create a project, build your team, and get AI-powered feedback instantly.</p>
                </div>
            </div>

        </div>
    );
};


import React, { useState } from 'react';
import { ProjectHub } from './ProjectHub';
import { ProjectDetail } from './ProjectDetail';
import { User } from '../types';

interface ProjectsViewProps {
    user: User | null;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ user }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const handleViewProject = (id: string) => {
        setSelectedProjectId(id);
    };

    const handleBackToHub = () => {
        setSelectedProjectId(null);
    };

    if (selectedProjectId) {
        return (
            <ProjectDetail
                projectId={selectedProjectId}
                onBack={handleBackToHub}
                currentUser={user}
            />
        );
    }

    return <ProjectHub onViewProject={handleViewProject} user={user} />;
};

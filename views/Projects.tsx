
import React, { useState } from 'react';
import { ProjectHub } from './ProjectHub';
import { ProjectDetail } from './ProjectDetail';
import { User } from '../types';

interface ProjectsViewProps {
    user: User | null;
    initialProjectId?: string | null;
    onBackFromProject?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ user, initialProjectId, onBackFromProject }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null);

    // Sync with prop navigation
    React.useEffect(() => {
        if (initialProjectId) setSelectedProjectId(initialProjectId);
    }, [initialProjectId]);

    const handleViewProject = (id: string) => {
        setSelectedProjectId(id);
    };

    const handleBackToHub = () => {
        setSelectedProjectId(null);
    };

    const handleBack = () => {
        if (onBackFromProject) {
            // If we have a custom back handler (from profile), use it
            onBackFromProject();
        } else {
            // Otherwise, just go back to the project hub
            handleBackToHub();
        }
    };

    if (selectedProjectId) {
        return (
            <ProjectDetail
                projectId={selectedProjectId}
                onBack={handleBack}
                currentUser={user}
            />
        );
    }

    return <ProjectHub onViewProject={handleViewProject} user={user} />;
};

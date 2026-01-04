import React, { useState, useEffect } from 'react';
import { fetchMaterials, uploadMaterial, API_URL } from '../api';

const NotesSection = () => {
    const [activeTrimester, setActiveTrimester] = useState('All');
    const [activeType, setActiveType] = useState('Notes'); // 'Notes' or 'Question Bank'
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [newResource, setNewResource] = useState({
        title: '',
        course: '',
        trimester: 'Summer',
        year: '2026',
        type: 'Notes'
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const trimesters = ['All', 'Summer', 'Fall', 'Spring'];
    const years = ['2023', '2024', '2025', '2026'];

    useEffect(() => {
        loadMaterials();
    }, []);

    const loadMaterials = async () => {
        try {
            const data = await fetchMaterials();
            setMaterials(data);
        } catch (error) {
            console.error('Failed to load materials', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !newResource.title || !newResource.course) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('title', newResource.title);
        formData.append('course', newResource.course);
        formData.append('trimester', newResource.trimester);
        formData.append('year', newResource.year);
        formData.append('type', newResource.type);
        formData.append('file', selectedFile);

        try {
            await uploadMaterial(formData);
            await loadMaterials();
            setIsModalOpen(false);
            setNewResource({
                title: '',
                course: '',
                trimester: 'Summer',
                year: '2026',
                type: 'Notes'
            });
            setSelectedFile(null);
        } catch (error) {
            console.error('Failed to upload material', error);
            alert('Failed to upload material');
        } finally {
            setUploading(false);
        }
    };

    const filteredResources = materials.filter(res => {
        const matchesTrimester = activeTrimester === 'All' || res.trimester === activeTrimester;
        const matchesType = res.type === activeType;
        const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.course.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTrimester && matchesType && matchesSearch;
    });

    const getIcon = (type) => {
        if (type === 'Question Bank') {
            // Clock/Time icon for Question Bank
            return <span style={{ fontSize: '1.5rem' }}>⏰</span>;
        }
        // Note icon for everything else
        return <span style={{ fontSize: '1.5rem' }}>📝</span>;
    };

    return (
        <div className="notes-container">
            <div className="feed-header-premium">
                <h2>Study Materials</h2>
                <p>Unlock Academic Excellence</p>

                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="feed-filters-container">
                <div className="feed-filters">
                    {trimesters.map(tri => (
                        <button
                            key={tri}
                            className={`filter-pill ${activeTrimester === tri ? 'active' : ''}`}
                            onClick={() => setActiveTrimester(tri)}
                        >
                            {tri}
                        </button>
                    ))}
                </div>
            </div>

            <div className="type-switcher" style={{ marginTop: '12px' }}>
                <button
                    className={`type-btn ${activeType === 'Notes' ? 'active' : ''}`}
                    onClick={() => setActiveType('Notes')}
                >
                    Academic Notes
                </button>
                <button
                    className={`type-btn ${activeType === 'Question Bank' ? 'active' : ''}`}
                    onClick={() => setActiveType('Question Bank')}
                >
                    Question Bank
                </button>
            </div>

            <div className="resource-grid">
                {filteredResources.length > 0 ? (
                    filteredResources.map(res => (
                        <div key={res.id} className="resource-card">
                            <div className="resource-icon-box">
                                {getIcon(res.type)}
                            </div>
                            <div className="resource-info">
                                <h3>{res.title}</h3>
                                <p>{res.course} • {res.trimester} {res.year}</p>
                                <div className="resource-meta">
                                    <span className="badge badge-trimester">{res.trimester}</span>
                                    <span className="badge badge-type">{res.type}</span>
                                </div>
                            </div>
                            <a
                                href={`${API_URL}/${res.file_path}`}
                                download
                                className="action-btn"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'var(--primary)', color: 'white', minWidth: '44px', minHeight: '44px' }}
                                title="Download"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </a>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        {loading ? <p>Loading resources...</p> : <p>No materials found.</p>}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button className="fab-button" onClick={() => setIsModalOpen(true)}>
                <span>+</span>
            </button>

            {/* Add Resource Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header-premium">
                            <button className="cancel-txt-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <h3>Add Material</h3>
                            <button
                                className="post-txt-btn"
                                disabled={!newResource.title || !newResource.course || !selectedFile || uploading}
                                onClick={handleUpload}
                            >
                                {uploading ? 'Adding...' : 'Add'}
                            </button>
                        </div>

                        <div className="post-form-premium" style={{ paddingTop: '24px' }}>
                            <div className="input-group-premium">
                                <label>Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Midterm Question 2025"
                                    className="premium-input-field"
                                    value={newResource.title}
                                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                />
                            </div>

                            <div className="input-group-premium">
                                <label>Course Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CSE225"
                                    className="premium-input-field"
                                    value={newResource.course}
                                    onChange={(e) => setNewResource({ ...newResource, course: e.target.value })}
                                />
                            </div>

                            <div className="form-row-premium">
                                <div className="input-group-premium" style={{ flex: 1 }}>
                                    <label>Trimester</label>
                                    <select
                                        className="premium-select-field"
                                        value={newResource.trimester}
                                        onChange={(e) => setNewResource({ ...newResource, trimester: e.target.value })}
                                    >
                                        {trimesters.filter(t => t !== 'All').map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group-premium" style={{ flex: 1 }}>
                                    <label>Year</label>
                                    <select
                                        className="premium-select-field"
                                        value={newResource.year}
                                        onChange={(e) => setNewResource({ ...newResource, year: e.target.value })}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="input-group-premium">
                                <label>Type</label>
                                <div className="category-selector-chips">
                                    {['Notes', 'Question Bank'].map(type => (
                                        <button
                                            key={type}
                                            className={`category-chip-btn ${newResource.type === type ? 'selected' : ''}`}
                                            onClick={() => setNewResource({ ...newResource, type })}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="input-group-premium">
                                <label>File Attachment</label>
                                <div
                                    className="upload-placeholder-zone"
                                    onClick={() => document.getElementById('material-file').click()}
                                    style={{ cursor: 'pointer', borderColor: selectedFile ? 'var(--primary)' : '#e5e7eb' }}
                                >
                                    <div className="upload-icon">
                                        {selectedFile ? '📄' : '📁'}
                                    </div>
                                    <p>{selectedFile ? selectedFile.name : 'Click to upload files or drag & drop'}</p>
                                    <span>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Maximum file size: 25MB'}</span>
                                    <input
                                        type="file"
                                        id="material-file"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesSection;

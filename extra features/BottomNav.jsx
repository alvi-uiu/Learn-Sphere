import React from 'react';

const BottomNav = ({ activeTab, setActiveTab }) => {
    const navItems = [
        {
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>,
            label: 'StudyFeed'
        },
        {
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6.5 18H20" /></svg>,
            label: 'Materials'
        },
        {
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
            label: 'Home',
        },
        {
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
            label: 'Profile'
        },
    ];

    return (
        <nav style={navStyle}>
            {navItems.map((item, index) => {
                const isActive = activeTab === item.label;
                return (
                    <div
                        key={index}
                        style={itemStyle(isActive)}
                        onClick={() => setActiveTab(item.label)}
                    >
                        <div style={iconWrapStyle(isActive)}>
                            {item.icon}
                        </div>
                        <span style={labelStyle(isActive)}>{item.label}</span>
                    </div>
                );
            })}
        </nav>
    );
};

const navStyle = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '12px 10px 30px',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
};

const itemStyle = (active) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
});

const iconWrapStyle = (active) => ({
    width: '40px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '16px',
    backgroundColor: active ? 'rgba(255, 107, 43, 0.1)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    transition: 'all 0.3s ease',
});

const labelStyle = (active) => ({
    fontSize: '0.65rem',
    fontWeight: active ? '700' : '500',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
});

export default BottomNav;

import React from 'react';

const FeatureCard = ({ icon, title, description, buttonText, onClick, delay }) => {
    return (
        <div
            className="feature-card"
            style={{
                ...cardStyle,
                animationDelay: `${delay}s`
            }}
        >
            <div style={iconContainerStyle}>
                {icon}
            </div>
            <div style={contentStyle}>
                <h3 style={titleStyle}>{title}</h3>
                <p style={descStyle}>{description}</p>
                <button
                    className="card-button"
                    style={buttonStyle}
                    onClick={onClick}
                >
                    {buttonText}
                    <span style={arrowStyle}>→</span>
                </button>
            </div>
        </div>
    );
};

const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    margin: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    border: '1px solid #f1f5f9',
};

const iconContainerStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)',
};

const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-main)',
};

const descStyle = {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
};

const buttonStyle = {
    marginTop: '8px',
    backgroundColor: 'transparent',
    color: 'var(--primary)',
    fontWeight: '700',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: 'fit-content',
    padding: 0,
};

const arrowStyle = {
    transition: 'transform 0.2s ease',
};

export default FeatureCard;

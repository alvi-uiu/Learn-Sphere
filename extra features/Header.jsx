import React from 'react';

const Header = () => {
  return (
    <header style={headerStyle}>
      <div style={patternStyle}></div>
      <div style={contentWrapStyle}>
        <div style={badgeStyle}>BETA</div>
        <h1 style={titleStyle}>StudyConnect</h1>
        <p style={taglineStyle}>The all-in-one platform for modern students</p>
      </div>
    </header>
  );
};

const headerStyle = {
  position: 'relative',
  background: 'var(--header-gradient)',
  padding: '60px 24px 40px',
  color: 'white',
  textAlign: 'left',
  borderBottomLeftRadius: 'var(--radius-xl)',
  borderBottomRightRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-lg)',
  overflow: 'hidden',
};

const patternStyle = {
  position: 'absolute',
  top: '-20%',
  right: '-10%',
  width: '300px',
  height: '300px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  filter: 'blur(50px)',
};

const contentWrapStyle = {
  position: 'relative',
  zIndex: 1,
};

const badgeStyle = {
  display: 'inline-block',
  padding: '2px 8px',
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '100px',
  fontSize: '0.7rem',
  fontWeight: '700',
  letterSpacing: '0.05em',
  marginBottom: '12px',
  backdropFilter: 'blur(4px)',
};

const titleStyle = {
  fontSize: '2.2rem',
  fontWeight: '700',
  lineHeight: '1.2',
  marginBottom: '8px',
};

const taglineStyle = {
  fontSize: '1rem',
  opacity: '0.9',
  fontWeight: '400',
  maxWidth: '240px',
};

export default Header;

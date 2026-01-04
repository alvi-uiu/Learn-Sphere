import React, { useState } from 'react';
import { registerUser, loginUser } from '../api';
import studyIcon from '../assets/image.png';

const Login = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        student_id: '',
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const response = await loginUser({
                    student_id: formData.student_id,
                    password: formData.password
                });
                onLogin(response.user);
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }

                if (!formData.name) {
                    setError('Name is required');
                    setLoading(false);
                    return;
                }

                await registerUser({
                    student_id: formData.student_id,
                    name: formData.name,
                    password: formData.password
                });

                setIsLogin(true);
                setError('Registration successful! Please login.');
                setFormData({ ...formData, password: '', confirmPassword: '' });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <img src={studyIcon} alt="LearnSphere" style={styles.logo} />
                    <h2 style={styles.title}>
                        {isLogin ? 'Welcome Back!' : 'Join LearnSphere'}
                    </h2>
                    <p style={styles.subtitle}>
                        {isLogin
                            ? 'Your academic simplified.'
                            : 'Connect with your campus community.'}
                    </p>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    )}

                    <input
                        type="text"
                        name="student_id"
                        placeholder="Student ID"
                        value={formData.student_id}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    />

                    {!isLogin && (
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading
                            ? 'Processing...'
                            : isLogin
                            ? 'Log In'
                            : 'Create Account'}
                    </button>
                </form>

                <div style={styles.switchText}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setFormData({
                                student_id: '',
                                name: '',
                                password: '',
                                confirmPassword: ''
                            });
                        }}
                        style={styles.switchLink}
                    >
                        {isLogin ? 'Register' : 'Log In'}
                    </span>
                </div>
            </div>
        </div>
    );
};




const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF0EB 0%, #FFF 100%)',
        padding: '20px'
    },
    card: {
        background: '#ffffff',
        padding: '40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(255, 107, 43, 0.1)',
        textAlign: 'center'
    },
    header: {
        marginBottom: '24px'
    },
    logo: {
        width: '60px',
        height: '60px',
        borderRadius: '14px',
        marginBottom: '16px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: '8px'
    },
    subtitle: {
        color: '#666',
        fontSize: '15px'
    },
    errorBox: {
        background: '#fff2f0',
        color: '#ff4d4f',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '20px',
        fontSize: '14px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '14px',
        border: '2px solid #f0f0f0',
        fontSize: '15px',
        outline: 'none',
        background: '#FAFAFA'
    },
    button: {
        background: 'var(--primary-gradient)',
        color: '#ffffff',
        border: 'none',
        padding: '14px',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'all 0.2s'
    },
    switchText: {
        marginTop: '24px',
        fontSize: '14px',
        color: '#666'
    },
    switchLink: {
        color: '#FF6B2B',
        fontWeight: '600',
        cursor: 'pointer'
    }
};

export default Login;

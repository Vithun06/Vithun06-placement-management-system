import React, { useState, useCallback } from 'react';
import { sanitizeInput, validateAuthForm } from './utils/security';

export default function Auth({ authMode, setAuthMode, handleAuthSubmit, handleAdminQuickAccess }) {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: sanitizeInput(value) }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateAuthForm(formData.email, formData.password);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await handleAuthSubmit(formData);
    } catch (err) {
      setErrors({ global: 'Authentication service temporary unavailable.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.bgContainer}>
      <div style={styles.overlay} />
      
      <main style={styles.authCard} aria-labelledby="auth-title">
        {/* Left Branding Side */}
        <section style={styles.brandSide}>
          <div style={styles.brandContent}>
            <span style={{ fontSize: '42px' }} role="img" aria-label="Graduate Cap">🎓</span>
            <h1 id="auth-title" style={styles.brandTitle}>Placement Portal</h1>
            <p style={styles.brandDesc}>
              Worldwide Placement Ecosystem connecting top-tier talent with global tech recruiters.
            </p>
            <div style={styles.badge}>
              🚀 100+ Global Companies Hiring
            </div>
          </div>
        </section>

        {/* Right Form Side */}
        <section style={styles.formSide}>
          <nav style={styles.tabContainer} aria-label="Auth Switcher">
            <button 
              type="button"
              onClick={() => setAuthMode('login')} 
              style={{ ...styles.tabBtn, borderBottom: authMode === 'login' ? '3px solid #007bff' : 'none', color: authMode === 'login' ? '#007bff' : '#6c757d' }}>
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => setAuthMode('signup')} 
              style={{ ...styles.tabBtn, borderBottom: authMode === 'signup' ? '3px solid #007bff' : 'none', color: authMode === 'signup' ? '#007bff' : '#6c757d' }}>
              Register
            </button>
          </nav>

          <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>
            {authMode === 'login' ? 'Welcome Back!' : 'Create Candidate Profile'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            {authMode === 'login' ? 'Access your application dashboard.' : 'Start applying to worldwide drives.'}
          </p>

          {errors.global && <div style={styles.errorBanner}>{errors.global}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="role-select">Select Portal Role</label>
              <select 
                id="role-select"
                name="role"
                value={formData.role} 
                onChange={handleChange}
                style={styles.input}>
                <option value="student">👨‍🎓 Candidate / Student</option>
                <option value="admin">👨‍💼 Placement Director (Admin)</option>
                <option value="company">🏢 Global Corporate Recruiter</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="email-input">Email Address</label>
              <input 
                id="email-input"
                name="email"
                type="email" 
                placeholder="candidate@university.edu" 
                value={formData.email} 
                onChange={handleChange}
                style={{ ...styles.input, borderColor: errors.email ? '#dc3545' : '#cbd5e1' }} 
              />
              {errors.email && <span style={styles.errorText}>{errors.email}</span>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="password-input">Password</label>
              <input 
                id="password-input"
                name="password"
                type="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange}
                style={{ ...styles.input, borderColor: errors.password ? '#dc3545' : '#cbd5e1' }} 
              />
              {errors.password && <span style={styles.errorText}>{errors.password}</span>}
            </div>

            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
              {isSubmitting ? 'Authenticating...' : authMode === 'login' ? '🔒 Secure Sign In' : '🚀 Complete Registration'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button type="button" onClick={handleAdminQuickAccess} style={styles.quickAdminBtn}>
              🔑 Direct Admin Portal Access
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  bgContainer: {
    minHeight: '100vh',
    width: '100%',
    backgroundImage: `url('https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1920&auto=format&fit=crop')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.70)',
    backdropFilter: 'blur(5px)',
  },
  authCard: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    width: '920px',
    maxWidth: '92%',
    minHeight: '540px',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
  brandSide: {
    flex: '1.1',
    minWidth: '300px',
    backgroundImage: `linear-gradient(135deg, rgba(14, 165, 233, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: '#ffffff',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: { fontSize: '32px', margin: '10px 0', fontWeight: '800' },
  brandDesc: { fontSize: '15px', lineHeight: '1.6', opacity: 0.9, marginBottom: '25px' },
  badge: { display: 'inline-block', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px' },
  formSide: { flex: '1', minWidth: '300px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  tabContainer: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' },
  tabBtn: { background: 'none', border: 'none', padding: '8px 12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  inputGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  quickAdminBtn: { background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' },
  errorText: { color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' },
  errorBanner: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }
};
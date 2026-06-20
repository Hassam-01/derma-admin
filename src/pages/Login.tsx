import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Role } from '../types/auth';

export const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [otpCode, setOtpCode]   = useState('');
  const [step, setStep]         = useState<'EMAIL' | 'OTP'>('EMAIL');
  
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  
  const { login } = useAuth();
  const navigate  = useNavigate();

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);

    try {
      const res = await api.post('/auth/login', { email });
      if (res.data.status === 'success') {
        setStep('OTP');
        setMessage('An OTP has been sent to your email.');
      } else {
        setError('Failed to request OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);

    try {
      const res = await api.post('/auth/otp/verify', { email, code: otpCode });
      
      if (res.data.status === 'success' && res.data.data.accessToken) {
        const token = res.data.data.accessToken;
        login(token);
        
        // basic jwt decode to get role
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const tokenRole = JSON.parse(jsonPayload).role;
        
        if (tokenRole === Role.VENDOR) navigate('/vendor');
        else if (tokenRole === Role.EXECUTIVE) navigate('/executive');
        else setError('Unauthorized role');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen" style={{ background: 'var(--bg)', padding: 24 }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            DermaLens <span style={{ color: 'var(--primary)' }}>Admin</span>
          </div>
          <div className="text-muted" style={{ marginTop: 4 }}>Vendor & Executive Portal</div>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '12px 16px', borderRadius: 8, color: 'var(--danger)', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}
        
        {message && (
          <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '12px 16px', borderRadius: 8, color: 'var(--success)', fontSize: 13, marginBottom: 20 }}>
            {message}
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={requestOtp}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required autoFocus />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Sending OTP…' : 'Continue with Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div className="form-group">
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Enter OTP Code</label>
                <button type="button" onClick={() => setStep('EMAIL')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                  Change Email
                </button>
              </div>
              <input type="text" className="form-control" style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: 20, fontWeight: 500 }} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" required autoFocus maxLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

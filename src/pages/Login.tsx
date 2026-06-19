import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Role } from '../types/auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email });
      if (response.data.status === 'success') {
        setStep('OTP');
        setMessage('An OTP has been sent to your email.');
      } else {
        setError('Failed to request OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request OTP. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/otp/verify', { email, code: otpCode });
      
      if (response.data.status === 'success' && response.data.data.accessToken) {
        // Log in the user by storing the token in context
        login(response.data.data.accessToken);
        
        // Handle navigation based on user's role from the token payload returned by the server, 
        // but here we wait for context to update or parse token role directly.
        const tokenStr = response.data.data.accessToken;
        // Basic JWT parsing to get role immediately for redirection
        const base64Url = tokenStr.split('.')[1];
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
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container flex-center">
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="text-gradient">DermaLens</h2>
          <p>Portal Login</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}
        
        {message && (
          <div className="badge badge-success" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            {message}
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@dermalens.com"
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input 
                type="text" 
                className="form-control" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required 
              />
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setStep('EMAIL')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Change Email
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

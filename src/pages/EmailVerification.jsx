import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, verifyEmail, resendVerification, isLoading, error } = useAuthStore();
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isResent, setIsResent] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);

  // Get message from location state (from registration)
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  // Check if token is in URL (from email link)
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      // Auto-verify if token is in URL
      handleVerifyAuto(urlToken);
    }
  }, [searchParams]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.is_verified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleVerifyAuto = async (urlToken) => {
    setIsAutoVerifying(true);
    const result = await verifyEmail(urlToken);
    setIsAutoVerifying(false);
    
    if (result.success) {
      setMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setMessage(result.error || 'Auto-verification failed. Please try manually.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setMessage('Please enter the verification token');
      return;
    }

    const result = await verifyEmail(token);
    if (result.success) {
      setMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setMessage(result.error || 'Verification failed');
    }
  };

  const handleResendEmail = async () => {
    const result = await resendVerification();
    if (result.success) {
      setIsResent(true);
      setMessage('Verification email sent! Check your inbox.');
      setTimeout(() => setIsResent(false), 5000);
    } else {
      setMessage(result.error || 'Failed to resend email');
    }
  };

  // If user is already verified, show loading instead of redirecting during render
  if (user?.is_verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Email already verified. Redirecting...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">Verify Your Email</h2>
        
        <p className="text-gray-600 mb-4 text-center">
          We sent a verification token to your email address. 
          Please enter it below to verify your account.
        </p>

        {message && (
          <div className={`${
            message.includes('success') ? 'bg-green-50 border-green-200 text-green-700' : 
            message.includes('sent') ? 'bg-blue-50 border-blue-200 text-blue-700' :
            'bg-yellow-50 border-yellow-200 text-yellow-700'
          } border px-4 py-3 rounded mb-4`}>
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Token *
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter the token from your email"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
              disabled={isAutoVerifying}
            />
            <p className="mt-1 text-xs text-gray-500">
              Check your email for the verification token
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || isAutoVerifying}
            className="w-full mb-3"
          >
            {isLoading || isAutoVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={handleResendEmail}
            disabled={isResent || isLoading || isAutoVerifying}
            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 text-sm"
          >
            {isResent ? 'Email Sent!' : "Didn't receive email? Resend"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-800 text-sm"
            disabled={isAutoVerifying}
          >
            Back to Login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default EmailVerification;
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const JoinOrganization = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, joinOrganization, isLoading, error } = useAuthStore();
  const [inviteData, setInviteData] = useState(null);
  const [message, setMessage] = useState('');

  const inviteToken = searchParams.get('invite_token');

  useEffect(() => {
    if (inviteToken && user) {
      // Auto-join if user is logged in and has token
      handleJoinOrganization();
    }
  }, [inviteToken, user]);

  const handleJoinOrganization = async () => {
    const result = await joinOrganization(inviteToken);
    if (result.success) {
      setMessage(result.message);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  if (!inviteToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Invalid Invitation</h2>
          <p className="text-gray-600">This invitation link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">Join Organization</h2>
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!user ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">You need to be logged in to join this organization.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Login to Continue
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              You've been invited to join an organization. Click below to accept the invitation.
            </p>
            <Button 
              onClick={handleJoinOrganization} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Joining...' : 'Join Organization'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default JoinOrganization;
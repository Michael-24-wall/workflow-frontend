import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const API_BASE_URL = 'http://localhost:9000/api';

const Organization = () => {
  const [organization, setOrganization] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('contributor');

  // Direct API calls - no Zustand
  const fetchOrganizationData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('🔄 Loading organization data...');

      // Make API calls directly
      const [orgResponse, invitesResponse, membersResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/organization/my_organization/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/organization/pending_invitations/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/organization/members/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/organization/statistics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process responses
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganization(orgData);
      }

      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json();
        setInvitations(invitesData);
      }

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

    } catch (error) {
      console.error('❌ Organization data error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/organization/send_invitation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      
      if (response.ok) {
        setEmail('');
        await fetchOrganizationData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send invitation');
      }
    } catch (error) {
      setError('Failed to send invitation');
    }
  };

  // Get user from localStorage token (simple approach)
  const getUserRole = () => {
    // You can get this from your existing auth store or localStorage
    return 'owner'; // Hardcode for now to test
  };

  const canSendInvitations = getUserRole() && 
    ['owner', 'manager', 'hr', 'ceo', 'administrator'].includes(getUserRole());

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6 px-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Organization</h1>
        {organization && (
          <div className="bg-primary-100 text-primary-800 px-4 py-2 rounded-lg">
            <span className="font-semibold">{organization.name}</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchOrganizationData}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-900">{stats.total_members || 0}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active_members || 0}</div>
            <div className="text-sm text-gray-600">Active Members</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending_invitations || 0}</div>
            <div className="text-sm text-gray-600">Pending Invites</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(stats.role_distribution || {}).length}
            </div>
            <div className="text-sm text-gray-600">Roles</div>
          </Card>
        </div>
      )}

      {/* Organization Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Organization Details</h2>
        {organization ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Organization Name</p>
              <p className="font-medium">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Role</p>
              <p className="font-medium capitalize">{getUserRole()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                organization.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {organization.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">
                {organization.created_at ? new Date(organization.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No organization data available</p>
            <p className="text-sm text-gray-400 mt-2">You are not part of an organization yet</p>
          </div>
        )}
      </Card>

      {/* Send Invitation */}
      {canSendInvitations && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Send Invitation</h2>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                >
                  <option value="contributor">Contributor</option>
                  <option value="staff">Staff</option>
                  <option value="hr">HR</option>
                  <option value="assistant_manager">Assistant Manager</option>
                  <option value="manager">Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="administrator">Administrator</option>
                  <option value="ceo">CEO</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={!email.trim()}
                  className="w-full"
                >
                  Send Invitation
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Pending Invitations */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pending Invitations</h2>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
            {invitations.length} pending
          </span>
        </div>
        
        {invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map(invite => (
              <div key={invite.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium">{invite.email}</span>
                  <span className="text-gray-500 ml-2">- {invite.role}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {invite.expires_at && `Expires: ${new Date(invite.expires_at).toLocaleDateString()}`}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    invite.is_accepted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invite.is_accepted ? 'Accepted' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No pending invitations</p>
          </div>
        )}
      </Card>

      {/* Organization Members */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Organization Members</h2>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
            {members.length} members
          </span>
        </div>
        
        {members.length > 0 ? (
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-800 font-medium text-sm">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{member.first_name} {member.last_name}</span>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {member.organization_role}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    member.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No members found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Organization;
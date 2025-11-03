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
  const [deletingId, setDeletingId] = useState(null);

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

      // FIXED: Use correct plural endpoints
      const [orgResponse, invitesResponse, membersResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/organizations/my_organization/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/organizations/pending_invitations/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/organizations/members/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/organizations/statistics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('📡 API Responses:', {
        org: orgResponse.status,
        invites: invitesResponse.status,
        members: membersResponse.status,
        stats: statsResponse.status
      });

      // Process responses with error handling
      if (!orgResponse.ok) {
        if (orgResponse.status === 404) {
          setOrganization(null);
          console.log('No organization found');
        } else {
          throw new Error(`Failed to fetch organization: ${orgResponse.statusText}`);
        }
      } else {
        const orgData = await orgResponse.json();
        setOrganization(orgData);
        console.log('Organization data:', orgData);
      }

      if (!invitesResponse.ok) {
        console.warn('Failed to fetch invitations:', invitesResponse.statusText);
        setInvitations([]);
      } else {
        const invitesData = await invitesResponse.json();
        setInvitations(invitesData);
        console.log('Invitations data:', invitesData);
      }

      if (!membersResponse.ok) {
        console.warn('Failed to fetch members:', membersResponse.statusText);
        setMembers([]);
      } else {
        const membersData = await membersResponse.json();
        setMembers(membersData);
        console.log('Members data:', membersData);
      }

      if (!statsResponse.ok) {
        console.warn('Failed to fetch statistics:', statsResponse.statusText);
        setStats(null);
      } else {
        const statsData = await statsResponse.json();
        setStats(statsData);
        console.log('Stats data:', statsData);
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
      
      // FIXED: Use correct plural endpoint
      const response = await fetch(`${API_BASE_URL}/organizations/send_invitation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Invitation sent:', result);
        setEmail('');
        setRole('contributor');
        await fetchOrganizationData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.detail || 'Failed to send invitation');
      }
    } catch (error) {
      setError('Failed to send invitation: ' + error.message);
    }
  };

  // DELETE INVITATION FUNCTION
  const handleDeleteInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to delete this invitation? This action cannot be undone.')) {
      return;
    }

    setDeletingId(invitationId);
    try {
      const token = localStorage.getItem('access_token');
      
      // FIXED: Use correct plural endpoint
      const response = await fetch(`${API_BASE_URL}/organizations/delete_invitation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ invitation_id: invitationId }),
      });

      if (response.ok) {
        // Remove the invitation from local state immediately
        setInvitations(prev => prev.filter(invite => invite.id !== invitationId));
        
        // Refresh stats to update pending invitations count
        const statsResponse = await fetch(`${API_BASE_URL}/organizations/statistics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
        
        console.log('Invitation deleted successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.detail || 'Failed to delete invitation');
      }
    } catch (error) {
      setError('Failed to delete invitation: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Get user from members list
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      
      // Decode token to get user email
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userEmail = payload.email;
      
      // Find user in members list
      return members.find(member => member.email === userEmail);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const userRole = currentUser?.organization_role;
  
  const canSendInvitations = userRole && 
    ['owner', 'manager', 'hr', 'ceo', 'administrator'].includes(userRole);

  const canDeleteInvitations = userRole && 
    ['owner', 'manager', 'hr', 'ceo', 'administrator'].includes(userRole);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if invitation is expiring soon
  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

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
              onClick={() => setError(null)}
            >
              Dismiss
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
              <p className="text-sm text-gray-600">Subdomain</p>
              <p className="font-medium">{organization.subdomain || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Role</p>
              <p className="font-medium capitalize">{userRole || 'N/A'}</p>
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
                {formatDate(organization.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="font-medium">{stats?.active_members || 0}</p>
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
                  {userRole === 'owner' && <option value="ceo">CEO</option>}
                  {userRole === 'owner' && <option value="owner">Owner</option>}
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
            <p className="text-sm text-gray-500">
              An invitation email will be sent with a link to join your organization.
            </p>
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
          <div className="space-y-4">
            {invitations.map(invite => (
              <div key={invite.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-lg">{invite.email}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        invite.role === 'owner' 
                          ? 'bg-purple-100 text-purple-800'
                          : invite.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : invite.role === 'hr'
                          ? 'bg-pink-100 text-pink-800'
                          : invite.role === 'administrator'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invite.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Invited by: {invite.invited_by?.first_name} {invite.invited_by?.last_name} 
                      ({invite.invited_by?.email})
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      invite.is_accepted 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invite.is_accepted ? 'Accepted' : 'Pending'}
                    </span>
                    {canDeleteInvitations && !invite.is_accepted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvitation(invite.id)}
                        disabled={deletingId === invite.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {deletingId === invite.id ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Deleting...</span>
                          </div>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Sent: {formatDate(invite.created_at)}</span>
                  <span className={`${isExpiringSoon(invite.expires_at) ? 'text-orange-600 font-medium' : ''}`}>
                    Expires: {formatDate(invite.expires_at)}
                    {isExpiringSoon(invite.expires_at) && ' ⚠️'}
                  </span>
                </div>
                
                {invite.message && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800 italic">"{invite.message}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No pending invitations</p>
            {canSendInvitations && (
              <p className="text-sm text-gray-400 mt-2">Send your first invitation to get started</p>
            )}
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
              <div key={member.id} className={`flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 ${
                currentUser?.id === member.id ? 'bg-blue-50 border-blue-200' : ''
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-800 font-medium text-sm">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{member.first_name} {member.last_name}</span>
                      {currentUser?.id === member.id && (
                        <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">You</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    member.organization_role === 'owner' 
                      ? 'bg-purple-100 text-purple-800'
                      : member.organization_role === 'manager'
                      ? 'bg-blue-100 text-blue-800'
                      : member.organization_role === 'hr'
                      ? 'bg-pink-100 text-pink-800'
                      : member.organization_role === 'administrator'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.organization_role}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    member.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    member.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.is_verified ? 'Verified' : 'Pending'}
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
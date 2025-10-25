import React, { useEffect, useState } from 'react';
import useAuthStore from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Organization = () => {
  const { 
    user, 
    organization, 
    invitations, 
    members, 
    getOrganization, 
    sendInvitation, 
    getPendingInvitations, 
    getMembers,
    getStatistics,
    isLoading,
    error 
  } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('contributor');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    await getOrganization();
    await getPendingInvitations();
    await getMembers();
    const statsResult = await getStatistics();
    if (statsResult.success) {
      setStats(statsResult.data);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    const result = await sendInvitation({ email, role });
    if (result.success) {
      setEmail('');
      await getPendingInvitations();
      const statsResult = await getStatistics();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    }
  };

  const canSendInvitations = user?.organization_role && 
    ['owner', 'manager', 'hr', 'ceo', 'administrator'].includes(user.organization_role);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Organization</h1>
        {organization && (
          <div className="bg-primary-100 text-primary-800 px-4 py-2 rounded-lg">
            <span className="font-semibold">{organization.name}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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
            <div className="text-2xl font-bold text-blue-600">{Object.keys(stats.role_distribution || {}).length}</div>
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
              <p className="font-medium capitalize">{user?.organization_role}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
                >
                  <option value="contributor">Contributor</option>
                  <option value="staff">Staff</option>
                  <option value="hr">HR</option>
                  <option value="assistant_manager">Assistant Manager</option>
                  <option value="manager">Manager</option>
                  {user?.organization_role === 'owner' && (
                    <option value="administrator">Administrator</option>
                  )}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              An invitation email will be sent with a link to join your organization
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
          <div className="space-y-3">
            {invitations.map(invite => (
              <div key={invite.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium">{invite.email}</span>
                  <span className="text-gray-500 ml-2">- {invite.role}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    Expires: {new Date(invite.expires_at).toLocaleDateString()}
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
            <p className="text-sm text-gray-400 mt-2">
              {canSendInvitations 
                ? 'Send invitations to grow your team' 
                : 'Only organization managers can send invitations'
              }
            </p>
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
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    member.organization_role === 'owner' ? 'bg-purple-100 text-purple-800' :
                    member.organization_role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    member.organization_role === 'hr' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
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
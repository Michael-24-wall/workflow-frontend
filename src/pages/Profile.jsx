import React from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Profile = () => {
  const { user, updateProfile, isLoading, error } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    }
  });

  const onSubmit = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      alert('Profile updated successfully!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="text-red-600">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                {...register('first_name', { required: 'First name is required' })}
                className="w-full border rounded px-3 py-2"
              />
              {errors.first_name && <span className="text-red-500 text-sm">{errors.first_name.message}</span>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                {...register('last_name', { required: 'Last name is required' })}
                className="w-full border rounded px-3 py-2"
              />
              {errors.last_name && <span className="text-red-500 text-sm">{errors.last_name.message}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border rounded px-3 py-2"
              disabled
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
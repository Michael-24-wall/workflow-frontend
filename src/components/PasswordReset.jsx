import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading, error } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const password = watch('new_password');

  // Get token from URL
  const uidb64 = searchParams.get('uidb64');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!uidb64 || !token) {
      alert('Invalid reset link. Please request a new password reset.');
      navigate('/forgot-password');
    }
  }, [uidb64, token, navigate]);

  const onSubmit = async (data) => {
    const resetData = {
      uidb64,
      token,
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    };

    const result = await resetPassword(resetData);
    if (result.success) {
      alert('Password reset successful! You can now login with your new password.');
      navigate('/login');
    }
  };

  if (!uidb64 || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600">Invalid reset link</p>
          <Link to="/forgot-password" className="text-primary-900 hover:text-primary-800 mt-4 inline-block">
            Request new reset link
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set new password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="new_password"
                  type="password"
                  {...register('new_password', { 
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                  placeholder="Enter new password"
                />
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm_password"
                  type="password"
                  {...register('confirm_password', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                  placeholder="Confirm new password"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-primary-900 hover:text-primary-800 text-sm">
                Back to login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;
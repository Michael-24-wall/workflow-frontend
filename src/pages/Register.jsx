import React, { useState } from 'react';
import { useForm } from 'react-hook-form';  
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Register = () => {  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      organizationType: 'create' // Default to creating organization
    }
  });
  const { register: registerUser, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [organizationType, setOrganizationType] = useState('create'); // 'create' or 'join'

  const inviteToken = searchParams.get('invite_token');
  const password = watch('password');

  // If there's an invite token, hide organization creation
  React.useEffect(() => {
    if (inviteToken) {
      setOrganizationType('join');
    }
  }, [inviteToken]);

  const onSubmit = async (data) => {
    // Format data for your Django API based on UserRegistrationSerializer
    const userData = {
      email: data.email,
      password: data.password,
      password2: data.confirmPassword, 
      first_name: data.firstName,
      last_name: data.lastName,
    };

    // Add invite token if present
    if (inviteToken) {
      userData.invite_token = inviteToken;
    } 
    // Add organization only if creating new one
    else if (organizationType === 'create' && data.organizationName) {
      userData.organization = { 
        name: data.organizationName
      };
    }
    // If joining existing, don't send organization data (user will be individual)

    const result = await registerUser(userData);
    if (result.success) {
      navigate('/login', { 
        state: { message: result.message || 'Registration successful! Please check your email for verification.' }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary-900 text-white p-3 rounded-lg">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-900">
          {inviteToken ? 'Join Organization' : 'Join Paperless System'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {inviteToken ? 'Complete registration to join the organization' : 'Create your account and get started'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 sm:px-10">
          {/* Invite Message */}
          {inviteToken && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              <p className="font-medium">You've been invited to join an organization!</p>
              <p className="mt-1 text-sm">Complete registration to accept the invitation.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error.includes('email already exists') ? (
                <div>
                  <p>This email is already registered.</p>
                  <p className="mt-1">
                    <Link to="/login" className="font-medium underline">
                      Sign in here
                    </Link> or use a different email address.
                  </p>
                </div>
              ) : (
                typeof error === 'object' ? JSON.stringify(error) : error
              )}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      type="text"
                      {...register('firstName', { 
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters'
                        }
                      })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      type="text"
                      {...register('lastName', { 
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters'
                        }
                      })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                    placeholder="john.doe@company.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters long
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Options - Only show if no invite token */}
            {!inviteToken && (
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  {/* Create New Organization Option */}
                  <div className="flex items-start">
                    <input
                      id="createOrganization"
                      type="radio"
                      {...register('organizationType')}
                      value="create"
                      defaultChecked={true}
                      onChange={(e) => setOrganizationType(e.target.value)}
                      className="h-4 w-4 text-primary-900 focus:ring-primary-900 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="createOrganization" className="ml-2 block text-sm text-gray-900">
                      <span className="font-medium">Create a new organization</span>
                      <p className="text-gray-500 text-xs mt-1">
                        You'll be the owner and can invite team members
                      </p>
                    </label>
                  </div>

                  {/* Join Existing Organization Option */}
                  <div className="flex items-start">
                    <input
                      id="joinOrganization"
                      type="radio"
                      {...register('organizationType')}
                      value="join"
                      onChange={(e) => setOrganizationType(e.target.value)}
                      className="h-4 w-4 text-primary-900 focus:ring-primary-900 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="joinOrganization" className="ml-2 block text-sm text-gray-900">
                      <span className="font-medium">Join existing organization</span>
                      <p className="text-gray-500 text-xs mt-1">
                        You'll need an invitation link from an organization admin
                      </p>
                    </label>
                  </div>
                </div>

                {/* Show organization name input only when creating new org */}
                {organizationType === 'create' && (
                  <div className="ml-6 bg-gray-50 p-4 rounded-lg mt-4">
                    <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                      Organization Name *
                    </label>
                    <div className="mt-1">
                      <input
                        id="organizationName"
                        type="text"
                        {...register('organizationName', { 
                          required: organizationType === 'create' ? 'Organization name is required' : false,
                          minLength: {
                            value: 2,
                            message: 'Organization name must be at least 2 characters'
                          }
                        })}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                        placeholder="Acme Inc."
                      />
                      {errors.organizationName && (
                        <p className="mt-1 text-sm text-red-600">{errors.organizationName.message}</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      This will be your workspace name. You can change it later.
                    </p>
                  </div>
                )}

                {/* Show join message when selecting join organization */}
                {organizationType === 'join' && (
                  <div className="ml-6 bg-blue-50 p-4 rounded-lg mt-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800">No invitation link?</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Ask your organization admin to send you an invitation email, or{' '}
                          <button 
                            type="button" 
                            onClick={() => {
                              setOrganizationType('create');
                              document.getElementById('createOrganization').click();
                            }}
                            className="underline font-medium"
                          >
                            create a new organization
                          </button>
                          {' '}instead.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                {...register('terms', { 
                  required: 'You must accept the terms and conditions'
                })}
                className="h-4 w-4 text-primary-900 focus:ring-primary-900 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="text-primary-900 hover:text-primary-800 underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-900 hover:text-primary-800 underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600">{errors.terms.message}</p>
            )}

            {/* Submit Button */}
            <div>
              <Button 
                type="submit" 
                className="w-full justify-center py-3 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {inviteToken ? 'Joining organization...' : 'Creating account...'}
                  </div>
                ) : (
                  inviteToken ? 'Join Organization' : 'Create account'
                )}
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-900 hover:text-primary-800 underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
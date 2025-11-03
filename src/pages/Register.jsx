import React, { useState } from 'react';
import { useForm } from 'react-hook-form';  
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Register = () => {  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { register: registerUser, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [organizationChoice, setOrganizationChoice] = useState('none'); // 'none', 'create', 'join'

  const inviteToken = searchParams.get('invite_token');
  const password = watch('password');

  // If there's an invite token, automatically set to join mode
  React.useEffect(() => {
    if (inviteToken) {
      setOrganizationChoice('join');
    }
  }, [inviteToken]);

  const onSubmit = async (data) => {
    // Format data for your Django API
    const userData = {
      email: data.email,
      password: data.password,
      password2: data.confirmPassword, 
      first_name: data.firstName,
      last_name: data.lastName,
    };

    // Handle organization based on user choice
    if (organizationChoice === 'create' && data.organizationName) {
      userData.organization = { 
        name: data.organizationName
      };
    } else if (organizationChoice === 'join' && data.inviteCode) {
      userData.invite_token = data.inviteCode;
    }
    // If 'none' or no organization choice, user registers without organization

    const result = await registerUser(userData);
    if (result.success) {
      // ✅ STORE EMAIL IN LOCALSTORAGE FOR VERIFICATION BACKUP
      if (data.email) {
        localStorage.setItem('user_email', data.email);
      }

      let message = '';
      if (organizationChoice === 'create') {
        message = 'Registration successful! Your organization has been created. Please verify your email to access the dashboard.';
      } else if (organizationChoice === 'join') {
        message = 'Registration successful! You have been added to the organization. Please verify your email to access the dashboard.';
      } else {
        message = 'Registration successful! You can join or create an organization later. Please verify your email to continue.';
      }

      setSuccessMessage(message);
      
      // Redirect to verification page after 3 seconds
      setTimeout(() => {
        navigate('/verify-email', { 
          state: { 
            message,
            email: data.email
          }
        });
      }, 3000);
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
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Registration Successful!</p>
                  <p className="mt-1">{successMessage}</p>
                  <p className="mt-2 text-xs">
                    Redirecting to verification page...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invite Message */}
          {inviteToken && !successMessage && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Organization Invitation</p>
                  <p className="mt-1">You've been invited to join an organization! Complete registration to accept.</p>
                </div>
              </div>
            </div>
          )}

          {error && !successMessage && (
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

          {!successMessage && (
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

              {/* Organization Choice - Only show if no invite token */}
              {!inviteToken && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Organization (Optional)
                    </label>
                    
                    {/* Choice Cards */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* No Organization */}
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          organizationChoice === 'none' 
                            ? 'border-primary-900 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setOrganizationChoice('none')}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            organizationChoice === 'none' 
                              ? 'border-primary-900 bg-primary-900' 
                              : 'border-gray-300'
                          }`} />
                          <div>
                            <h3 className="font-medium text-gray-900">No Organization</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Register without an organization. You can join or create one later.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Create New Organization */}
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          organizationChoice === 'create' 
                            ? 'border-primary-900 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setOrganizationChoice('create')}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            organizationChoice === 'create' 
                              ? 'border-primary-900 bg-primary-900' 
                              : 'border-gray-300'
                          }`} />
                          <div>
                            <h3 className="font-medium text-gray-900">Create New Organization</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Start a new organization and become the administrator.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Join Existing Organization */}
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          organizationChoice === 'join' 
                            ? 'border-primary-900 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setOrganizationChoice('join')}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            organizationChoice === 'join' 
                              ? 'border-primary-900 bg-primary-900' 
                              : 'border-gray-300'
                          }`} />
                          <div>
                            <h3 className="font-medium text-gray-900">Join Existing Organization</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Use an invitation code to join an existing organization.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Create Organization Form */}
                  {organizationChoice === 'create' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Create New Organization</h4>
                      <div>
                        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                          Organization Name *
                        </label>
                        <div className="mt-1">
                          <input
                            id="organizationName"
                            type="text"
                            {...register('organizationName', { 
                              required: organizationChoice === 'create' ? 'Organization name is required' : false,
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
                    </div>
                  )}

                  {/* Join Organization Form */}
                  {organizationChoice === 'join' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Join Existing Organization</h4>
                      <div>
                        <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
                          Invitation Code *
                        </label>
                        <div className="mt-1">
                          <input
                            id="inviteCode"
                            type="text"
                            {...register('inviteCode', { 
                              required: organizationChoice === 'join' ? 'Invitation code is required' : false,
                            })}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-900 focus:border-primary-900 sm:text-sm"
                            placeholder="Enter invitation code"
                          />
                          {errors.inviteCode && (
                            <p className="mt-1 text-sm text-red-600">{errors.inviteCode.message}</p>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Get an invitation code from your organization administrator.
                        </p>
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
          )}

          {/* Show verification instructions after successful registration */}
          {successMessage && (
            <div className="text-center space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Important:</span>
                </div>
                <p className="mt-2">
                  Check your email for a verification token. You'll need it to complete your registration.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/verify-email')}
                className="w-full justify-center"
              >
                Go to Verification Page
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Register;
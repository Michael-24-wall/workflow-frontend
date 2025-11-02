import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Profile = () => {
  const { user, updateProfile, uploadProfilePicture, isLoading, error } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profile_picture_url || '');
  const fileInputRef = useRef(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    }
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Image size should be less than 2MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data) => {
    let result;
    
    if (selectedImage) {
      // If there's a new image, use FormData
      const formData = new FormData();
      
      // Append text fields
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      // Append image - FIXED: Changed from 'update_profile' to 'profile_picture'
      formData.append('profile_picture', selectedImage);
      
      result = await updateProfile(formData);
    } else {
      // If no image, use regular JSON
      result = await updateProfile(data);
    }
    
    if (result.success) {
      alert('Profile updated successfully!');
      setSelectedImage(null); // Reset selected image after successful update
    }
  };

  // Alternative: Separate image upload function
  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    const result = await uploadProfilePicture(selectedImage);
    if (result.success) {
      alert('Profile picture updated successfully!');
      setSelectedImage(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {/* Profile Picture Section */}
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  src={imagePreview || user?.profile_picture_url || '/default-avatar.png'}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <div className="space-x-2">
                <Button
                  type="button"
                  onClick={triggerFileInput}
                  variant="outline"
                  disabled={isLoading}
                >
                  Change Photo
                </Button>
                {selectedImage && (
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isLoading}
                  >
                    Upload Only Photo
                  </Button>
                )}
              </div>
              {selectedImage && (
                <p className="text-sm text-green-600">
                  New image selected: {selectedImage.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                {...register('first_name', { required: 'First name is required' })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {errors.first_name && (
                <span className="text-red-500 text-sm">{errors.first_name.message}</span>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                {...register('last_name', { required: 'Last name is required' })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {errors.last_name && (
                <span className="text-red-500 text-sm">{errors.last_name.message}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              disabled
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
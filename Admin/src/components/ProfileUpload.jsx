import React, { useState, useRef, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ProfileUpload = ({ currentUser, onProfileUpdate, size = 'large' }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Size configurations
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-24 h-24 sm:w-32 sm:h-32'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  useEffect(() => {
    // Load existing profile image when component mounts
    const loadProfileImage = async () => {
      try {
        console.log('🔍 Loading profile for user:', currentUser._id);
        const response = await fetch(`${API_BASE_URL}/api/profiles/${currentUser._id}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('✅ Profile loaded:', result.data.imageUrl);
            setProfileImage(`${API_BASE_URL}${result.data.imageUrl}`);
          }
        } else if (response.status !== 404) {
          console.error('❌ Failed to load profile');
        } else {
          console.log('📋 No profile found for user');
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
      }
    };

    if (currentUser?._id) {
      loadProfileImage();
    }
  }, [currentUser]);

  const handleFileSelect = (event) => {
    console.log('🔥 handleFileSelect triggered!');
    const file = event.target.files[0];
    console.log('📁 Selected file:', file);
    if (file) {
      console.log('✅ File found, calling handleFileUpload');
      handleFileUpload(file);
    } else {
      console.log('❌ No file selected');
    }
  };

  const handleFileUpload = async (file) => {
    console.log('🚀 handleFileUpload started!');
    console.log('📁 File to upload:', file);
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      setError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      setError('File size must be less than 5MB');
      return;
    }

    console.log('✅ File validation passed');
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0);

    try {
      console.log('📤 Starting profile upload for user:', currentUser._id);
      console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
      console.log('🌐 API URL:', `${API_BASE_URL}/api/profiles/upload`);

      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('userId', currentUser._id);

      const response = await fetch(`${API_BASE_URL}/api/profiles/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('✅ Profile upload successful:', result);

      if (result.success && result.data) {
        // Update the profile image URL with the server URL
        const newImageUrl = `${API_BASE_URL}${result.data.imageUrl}`;
        setProfileImage(newImageUrl);
        setUploadProgress(100);

        // Update localStorage with new user data (if needed)
        const updatedUser = { ...currentUser, profileImage: result.data.imageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Call parent callback to update state
        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }

        // Show success message
        setSuccessMessage('Profile uploaded successfully!');
        setError(null); // Clear any previous errors

        // Hide success message and progress after 3 seconds
        setTimeout(() => {
          setUploadProgress(0);
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('❌ Profile upload error:', error);
      setError(error.message || 'Failed to upload profile image');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    console.log('🖱️ Profile image clicked!');
    console.log('🔄 isUploading:', isUploading);
    if (!isUploading) {
      console.log('📂 Opening file picker...');
      fileInputRef.current?.click();
    } else {
      console.log('⏳ Upload in progress, ignoring click');
    }
  };

  const getInitials = () => {
    if (!currentUser?.name) return '?';
    const names = currentUser.name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return currentUser.name.charAt(0).toUpperCase();
  };

  const getRoleColor = () => {
    switch (currentUser?.role) {
      case 'admin':
        return 'from-purple-500 to-indigo-600';
      case 'teacher':
        return 'from-blue-500 to-cyan-600';
      case 'student':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Profile Image Container */}
      <div 
        className={`${sizeClasses[size]} rounded-full relative cursor-pointer overflow-hidden border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 ${isUploading ? 'opacity-70' : 'hover:scale-105'}`}
        onClick={handleClick}
      >
        {profileImage ? (
          <img 
            src={profileImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={() => {
              console.error('Failed to load profile image');
              setProfileImage(null);
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getRoleColor()} flex items-center justify-center`}>
            <span className={`font-bold text-white ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-lg' : 'text-xl'}`}>
              {getInitials()}
            </span>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-xs font-semibold">
              {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {successMessage && !isUploading && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-70 flex items-center justify-center">
            <div className="text-white text-xs font-semibold">
              ✅
            </div>
          </div>
        )}

        {/* Upload Icon Overlay */}
        {!isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
            <div className="text-white opacity-0 hover:opacity-100 text-xs font-semibold">
              📷
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      {size === 'large' && (
        <div className="text-center">
          <div className={`font-semibold text-gray-700 ${textSizes[size]}`}>
            {currentUser?.name || 'User'}
          </div>
          <div className={`text-gray-500 ${textSizes[size]} capitalize`}>
            {currentUser?.role || 'Role'}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-xs text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="text-green-500 text-xs text-center max-w-xs font-semibold animate-pulse">
          ✅ {successMessage}
        </div>
      )}

      {/* Upload Instructions */}
      {size === 'large' && !isUploading && (
        <div className="text-xs text-gray-400 text-center max-w-xs">
          Click to upload profile picture
        </div>
      )}

      {/* File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};

export default ProfileUpload;
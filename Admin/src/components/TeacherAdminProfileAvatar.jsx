import React, { useState, useRef, useEffect } from 'react';

const TeacherAdminProfileAvatar = ({ currentUser, onProfileUpdate }) => {
  const [profile, setProfile] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();

  // Debug: Log currentUser
  console.log('TeacherAdminProfileAvatar rendered with currentUser:', currentUser);

  // Storage key for local fallback
  const userId = currentUser?.id || currentUser?._id;
  const userRole = currentUser?.role || 'unknown';
  const storageKey = userId ? `${userRole}_profile_${userId}` : `${userRole}_profile_default`;

  console.log('Generated storage key:', storageKey);

  useEffect(() => {
    console.log('TeacherAdminProfileAvatar useEffect triggered');
    console.log('Current user:', currentUser);
    console.log('Storage key:', storageKey);
    
    // Load profile image from server or localStorage
    if (currentUser?.profileImage) {
      // If user has profile image from server, use it
      let serverImageUrl = currentUser.profileImage;
      
      console.log('User has profileImage:', serverImageUrl);
      
      // Handle both absolute and relative URLs
      if (serverImageUrl.startsWith('/uploads/')) {
        serverImageUrl = `http://localhost:5000${serverImageUrl}`;
      } else if (!serverImageUrl.startsWith('http')) {
        serverImageUrl = `http://localhost:5000/${serverImageUrl}`;
      }
      
      console.log('Setting server image URL:', serverImageUrl);
      setProfile(serverImageUrl);
    } else {
      // Fallback to localStorage
      const localProfile = localStorage.getItem(storageKey) || '';
      console.log('No server image, using localStorage:', localProfile ? 'Found local image' : 'No local image');
      setProfile(localProfile);
    }
  }, [currentUser, storageKey]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);
    console.log('Current user:', currentUser);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview first
      const reader = new FileReader();
      reader.onload = (ev) => {
        console.log('Setting local preview');
        setProfile(ev.target.result);
        localStorage.setItem(storageKey, ev.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('userId', userId);
      formData.append('userRole', userRole);

      console.log('Uploading to server...');
      console.log('FormData contents:', {
        userId: userId,
        userRole: currentUser.role,
        fileName: file.name
      });

      const response = await fetch('http://localhost:5000/api/users/upload-profile', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        
        // Update user profile in localStorage
        const updatedUser = {
          ...currentUser,
          profileImage: result.profileImageUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update profile display with server URL
        const serverImageUrl = `http://localhost:5000${result.profileImageUrl}`;
        setProfile(serverImageUrl);
        
        // Call parent callback if provided
        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }
        
        console.log('Profile image updated successfully!');
      } else {
        const error = await response.json();
        console.error('Upload failed:', error.message);
        alert(`Upload failed: ${error.message}`);
        // Keep the local preview even if server upload fails
      }
    } catch (error) {
      console.error('Profile upload error:', error);
      alert(`Upload error: ${error.message}`);
      // Keep the local preview even if server upload fails
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gray-200 border-4 border-violet-400 overflow-hidden mb-1 cursor-pointer hover:ring-4 hover:ring-violet-300 hover:border-violet-600 transition-all duration-200 relative ${isUploading ? 'opacity-50' : ''} hover:shadow-lg hover:scale-105`}
        title="I-click para mag-upload ng profile picture"
        onClick={() => {
          console.log('Profile picture clicked!');
          if (!isUploading && fileInputRef.current) {
            console.log('Opening file picker...');
            fileInputRef.current.click();
          }
        }}
      >
        {profile ? (
          <img src={profile} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-gradient-to-br from-violet-100 to-violet-200 hover:from-violet-200 hover:to-violet-300 transition-all">
            <span className="text-3xl sm:text-4xl">�</span>
            <span className="text-xs font-bold mt-1">UPLOAD</span>
          </div>
        )}
        
        {/* Upload indicator overlay */}
        {!profile && (
          <div className="absolute bottom-0 right-0 bg-violet-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            +
          </div>
        )}
        
        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          </div>
        )}
      </div>
      
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <span className="text-xs text-gray-500 capitalize">{currentUser?.role || 'Profile'}</span>
      <span className="text-xs text-blue-600 font-medium text-center">
        {currentUser?.name || 'User'}
      </span>
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 mt-2 text-center">
        <span className="text-xs text-yellow-800 font-semibold block">
          📸 I-CLICK ANG PROFILE PICTURE 📸
        </span>
        <span className="text-xs text-yellow-700 block mt-1">
          Para mag-upload ng larawan mo
        </span>
      </div>
    </div>
  );
};

export default TeacherAdminProfileAvatar;
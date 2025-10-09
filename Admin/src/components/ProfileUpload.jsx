import React, { useState, useRef } from 'react';
import { FaCamera, FaUser, FaUpload, FaTimes } from 'react-icons/fa';

const ProfileUpload = ({ currentUser, onProfileUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  // Only show for teachers and admins
  if (!currentUser || currentUser.role === 'student') {
    return null;
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
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

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setShowModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!previewImage) return;

    setIsUploading(true);
    try {
      // Convert base64 to file
      const response = await fetch(previewImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('profileImage', blob, 'profile.jpg');
      formData.append('userId', currentUser.id);
      formData.append('userRole', currentUser.role);

      // Upload to backend
      const uploadResponse = await fetch('http://localhost:3000/api/users/upload-profile', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        
        // Update user profile in localStorage
        const updatedUser = {
          ...currentUser,
          profileImage: result.profileImageUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Call parent callback if provided
        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }
        
        alert('Profile image updated successfully!');
        setShowModal(false);
        setPreviewImage(null);
      } else {
        const error = await uploadResponse.json();
        alert(`Failed to upload profile image: ${error.message}`);
      }
    } catch (error) {
      console.error('Profile upload error:', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Profile Picture with Upload Button */}
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {currentUser.profileImage ? (
            <img
              src={currentUser.profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
              <FaUser className="text-white text-2xl" />
            </div>
          )}
        </div>
        
        {/* Upload Button Overlay */}
        <button
          onClick={triggerFileInput}
          className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200 border-2 border-white"
          title="Upload Profile Picture"
        >
          <FaCamera className="text-sm" />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Profile Picture
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Preview */}
            {previewImage && (
              <div className="mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-gray-200">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Upload Info */}
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Image Requirements:
                </h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Format: JPG, PNG, or GIF</li>
                  <li>• Maximum size: 5MB</li>
                  <li>• Recommended: Square image for best results</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading || !previewImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload />
                    Upload
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileUpload;
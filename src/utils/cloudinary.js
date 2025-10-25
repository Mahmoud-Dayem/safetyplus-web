// Cloudinary configuration and upload utility
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// Debug configuration
 
/**
 * Upload image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {function} onProgress - Progress callback function
 * @param {string} folder - Optional folder name in Cloudinary
 * @param {string} docId - Document ID to use in filename
 * @returns {Promise<string>} - Returns the secure URL of uploaded image
 */
export const uploadImageToCloudinary = async (file, onProgress = null, folder = 'audit_reports_hcc', docId = null) => {
  try {
    // Validate configuration
    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary cloud name not configured');
    }
    
    if (!CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary upload preset not configured');
    }

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
 

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Generate filename same as Supabase format if docId provided
    if (docId) {
      const randomString = Math.random().toString(36).substr(2, 9);
      const fileName = `${docId}_${randomString}`;
      // Use the full path including folder for public_id
      const fullPath = `${folder}/${fileName}`;
      formData.append('public_id', fullPath);
     } else {
      formData.append('folder', folder);
    }
    
    // Note: Transformations are configured in the upload preset, not here

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.secure_url) {
                resolve(response.secure_url);
              } else {
                console.error('Cloudinary response:', response);
                reject(new Error('Upload failed: No URL returned'));
              }
            } catch (parseError) {
              console.error('Parse error:', parseError, 'Response:', xhr.responseText);
              reject(new Error('Upload failed: Invalid response'));
            }
          } else {
            let errorMessage = `Upload failed: HTTP ${xhr.status}`;
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              if (errorResponse.error && errorResponse.error.message) {
                errorMessage += ` - ${errorResponse.error.message}`;
              }
              console.error('Cloudinary error response:', errorResponse);
            } catch (e) {
              console.error('Raw error response:', xhr.responseText);
            }
            reject(new Error(errorMessage));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed: Network error'));
      };

      // Open connection and send request
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    // Note: Deletion requires server-side implementation due to API secret requirement
    // This is a placeholder for future server-side endpoint
    console.warn('Image deletion should be implemented on server-side for security');
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {object} transformations - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getOptimizedImageUrl = (imageUrl, transformations = {}) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }

  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto',
    ...transformations
  };

  // Extract public ID from URL
  const urlParts = imageUrl.split('/');
  const uploadIndex = urlParts.indexOf('upload');
  
  if (uploadIndex === -1) return imageUrl;

  // Build transformation string
  const transformString = Object.entries(defaultTransformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  // Insert transformation into URL
  urlParts.splice(uploadIndex + 1, 0, transformString);
  
  return urlParts.join('/');
};
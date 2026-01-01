import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function ImageGallery({ projectId, refreshTrigger, compact = false }) {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchImages();
  }, [projectId, refreshTrigger]);

  // Reset current image index when images change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/images`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📸 Images received from server:', data);
        console.log('📸 First image details:', data[0]);
        setImages(data);
      } else {
        console.error('Napaka pri pridobivanju slik');
      }
    } catch (err) {
      console.error('Napaka pri povezavi s strežnikom:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (imageId) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati to sliko?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/projects/images/${imageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert('Slika uspešno izbrisana!');
        fetchImages(); // Refresh the gallery
      } else {
        const data = await response.json();
        alert(data.error || 'Napaka pri brisanju slike!');
      }
    } catch (err) {
      console.error('Napaka pri brisanju slike:', err);
      alert('Napaka pri povezavi s strežnikom!');
    }
  };

  const getImageUrl = (image) => {
    // The file_path contains the full server path, we need to extract just the filename
    // file_path example: "C:\Users\...\uploads\projects\images-1234567890-123456789.jpg"
    // We need: "images-1234567890-123456789.jpg"
    let filename;
    
    if (image.file_path) {
      // Extract filename from the full path - handle Windows paths
      const pathParts = image.file_path.replace(/\\/g, '/').split('/');
      filename = pathParts[pathParts.length - 1];
    } else if (image.filename) {
      // Fallback to filename field
      filename = image.filename;
    } else {
      console.error('No filename available for image:', image);
      return '';
    }
    
    const url = `http://localhost:5000/uploads/projects/${filename}`;
    console.log('🖼️ Image URL constructed:', {
      originalFilename: image.filename,
      filePath: image.file_path,
      extractedFilename: filename,
      finalUrl: url
    });
    return url;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Nalagam slike...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return compact ? null : (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-gray-600">Ni naloženih slik</p>
      </div>
    );
  }

  // Calculate grid layout based on number of images
  const getGridLayout = (imageCount) => {
    if (imageCount === 1) {
      return "flex justify-center";
    } else if (imageCount === 2) {
      return "grid grid-cols-2 gap-12 justify-items-center";
    } else if (imageCount <= 4) {
      return "grid grid-cols-2 gap-10 justify-items-center";
    } else if (imageCount <= 6) {
      return "grid grid-cols-3 gap-8 justify-items-center";
    } else {
      return "grid grid-cols-4 gap-6 justify-items-center";
    }
  };

  // Calculate image container size based on number of images (maintains aspect ratio)
  const getImageContainerSize = (imageCount) => {
    if (imageCount === 1) {
      return "w-[600px] h-[450px]"; // Fixed size for single image
    } else if (imageCount === 2) {
      return "w-[400px] h-[300px]"; // Fixed size for 2 images
    } else if (imageCount <= 4) {
      return "w-[300px] h-[225px]"; // Fixed size for 3-4 images
    } else {
      return "w-[250px] h-[190px]"; // Fixed size for many images
    }
  };

  return (
    <div className={compact ? "w-full" : "mb-8 w-full mx-auto"}>
      {!compact && <h3 className="text-xl font-semibold text-blue-800 mb-8 text-center">Galerija slik ({images.length})</h3>}
      
      {compact ? (
        // Compact mode - single image with navigation
        <div className="relative flex items-center justify-center">
          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-opacity-75 transition-opacity z-10"
            >
              ‹
            </button>
          )}
          
          <div className="relative group">
            <img
              src={getImageUrl(images[currentImageIndex])}
              alt={images[currentImageIndex].filename}
              className="w-full h-32 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(images[currentImageIndex])}
              onError={(e) => {
                console.error('❌ Image failed to load:', getImageUrl(images[currentImageIndex]));
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', getImageUrl(images[currentImageIndex]));
              }}
            />
            
            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-opacity-75 transition-opacity z-10"
            >
              ›
            </button>
          )}
        </div>
      ) : (
        <div className={getGridLayout(images.length)}>
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={getImageUrl(image)}
                alt={image.filename}
                className={`${getImageContainerSize(images.length)} object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => setSelectedImage(image)}
                onError={(e) => {
                  console.error('❌ Image failed to load:', getImageUrl(image));
                  e.target.style.display = 'none';
                  // Show error placeholder
                  const placeholder = document.createElement('div');
                  placeholder.className = `${getImageContainerSize(images.length)} bg-gray-200 rounded-lg flex items-center justify-center text-gray-500`;
                  placeholder.innerHTML = '❌ Slika se ni naložila';
                  e.target.parentNode.appendChild(placeholder);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', getImageUrl(image));
                }}
              />
              
              {/* Delete button - appears on hover */}
              <button
                onClick={() => deleteImage(image.id)}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ×
              </button>
              
              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="truncate">{image.filename}</p>
                <p>{formatFileSize(image.file_size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={getImageUrl(selectedImage)}
              alt={selectedImage.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-200"
            >
              ×
            </button>
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="font-medium">{selectedImage.filename}</p>
              <p className="text-sm">{formatFileSize(selectedImage.file_size)}</p>
              <p className="text-sm">{new Date(selectedImage.created_at).toLocaleDateString('sl-SI')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
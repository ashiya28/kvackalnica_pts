import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function ImageUpload({ projectId, onImagesUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Samo slike so dovoljene!');
      return;
    }
    
    if (imageFiles.length > 10) {
      alert('Maksimalno 10 slik naenkrat!');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      // Get token from sessionStorage for FormData requests
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        if (onImagesUploaded) {
          onImagesUploaded();
        }
      } else {
        alert(data.error || 'Napaka pri nalaganju slik!');
      }
    } catch (err) {
      console.error('Napaka pri nalaganju slik:', err);
      alert('Napaka pri povezavi s strežnikom!');
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  return (
    <div className="mb-8 text-center">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
        disabled={isUploading}
      />
      <label
        htmlFor="image-upload"
        className={`inline-flex items-center px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 cursor-pointer ${
          isUploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 shadow-lg'
        }`}
      >
        {isUploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Nalagam...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Dodaj slike
          </>
        )}
      </label>
      <p className="text-sm text-gray-500 mt-2">Maksimalno 10 slik, vsaka do 5MB</p>
    </div>
  );
}

export default ImageUpload;

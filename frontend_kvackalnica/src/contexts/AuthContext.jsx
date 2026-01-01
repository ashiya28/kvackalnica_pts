import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If we can't decode, consider it expired
    }
  };

  // Initialize auth state from sessionStorage on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = sessionStorage.getItem('token');
        if (storedToken) {
          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            console.log('Token expired, logging out user');
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null);
          } else {
            setToken(storedToken);
            // Try to decode token to get basic user info without making API call
            try {
              const payload = JSON.parse(atob(storedToken.split('.')[1]));
              setUser({
                id: payload.id,
                email: payload.email,
                username: payload.username
              });
            } catch (decodeError) {
              console.error('Error decoding token:', decodeError);
              sessionStorage.removeItem('token');
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Periodic token expiration check
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (token && isTokenExpired(token)) {
        console.log('Token expired during periodic check, logging out');
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store only the token in sessionStorage
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || "Napačna prijava!" };
      }
    } catch (err) {
      console.error("Napaka pri prijavi:", err);
      return { success: false, message: "Napaka pri povezavi s strežnikom!" };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    if (!token) return false;
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Token expired during authentication check, logging out');
      logout();
      return false;
    }
    return true;
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // Simple helper to check if response is 401 and redirect to login
  const checkAuthResponse = (response, navigate) => {
    if (response.status === 401) {
      console.log('Token expired, redirecting to login');
      logout();
      navigate('/Login');
      return true; // Indicates redirect happened
    }
    return false; // No redirect needed
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
    getAuthHeaders,
    checkAuthResponse
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

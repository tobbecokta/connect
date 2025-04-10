import React, { useEffect, useState } from 'react';
import MessagingApp from './components/MessagingApp';
import LoginPage from './components/auth/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// This component wraps the app and conditionally renders based on auth state
const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const [initializing, setInitializing] = useState(false);

  if (loading || initializing) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading</h2>
          <p className="text-gray-600">Please wait while we set up your messaging environment...</p>
        </div>
      </div>
    );
  }

  // If no session, user needs to log in
  if (!session) {
    return <LoginPage />;
  }

  // User is authenticated, show the app
  return (
    <div className="h-screen bg-gray-100">
      <MessagingApp />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
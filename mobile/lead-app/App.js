// App.js

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from './screens/LoginScreen';
import AdminStack from './navigation/AdminStack';
import WorkerStack from './navigation/WorkerStack';

export default function App() {
  const [user, setUser] = useState(null); // { id, name, role, token }

  const handleLogin = (userData) => {
    console.log('Logged in user:', userData);
    // Если API возвращает { user: {...}, token: '...' }
    const payload = userData.user ? {
      ...userData.user,
      token: userData.token || userData.user.token,
    } : userData;
    setUser(payload);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : isAdmin ? (
        <AdminStack user={user} onLogout={handleLogout} />
      ) : (
        <WorkerStack user={user} onLogout={handleLogout} />
      )}
    </NavigationContainer>
  );
}

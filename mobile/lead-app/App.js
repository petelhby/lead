import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from './screens/LoginScreen';
import AdminStack from './navigation/AdminStack';
import WorkerStack from './navigation/WorkerStack';

export default function App() {
  const [user, setUser] = useState(null); // { id, name, role, token }

  const handleLogin = (userData) => {
    setUser(userData); // вызывается после успешного входа
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <NavigationContainer>
      {user.role === 'ADMIN' ? <AdminStack user={user} /> : <WorkerStack user={user} />}
    </NavigationContainer>
  );
}

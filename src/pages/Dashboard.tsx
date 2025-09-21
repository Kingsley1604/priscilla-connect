import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import DashboardComponent from "@/components/Dashboard";

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardComponent
      userRole={user.role}
      userName={user.name}
      userAvatar={user.avatar}
      onLogout={logout}
    />
  );
};

export default Dashboard;
import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import DashboardComponent from "@/components/Dashboard";
import { ExamDemoSetup } from "@/components/admin/ExamDemoSetup";

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {user.role === 'admin' && <ExamDemoSetup />}
      <DashboardComponent
        userRole={user.role}
        userName={user.name}
        userAvatar={user.avatar}
        onLogout={logout}
      />
    </>
  );
};

export default Dashboard;
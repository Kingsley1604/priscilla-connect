import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import DashboardComponent from "@/components/Dashboard";
import { ExamDemoSetup } from "@/components/admin/ExamDemoSetup";

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading || !user) {
    return null;
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
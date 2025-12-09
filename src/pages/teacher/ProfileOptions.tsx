import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Shield, User, Power } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingScreen";

const ProfileOptions = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const options = [
    {
      title: "Change Password",
      description: "Update your account password for security",
      icon: Lock,
      path: "/teacher/password-change",
      color: "bg-blue-500"
    },
    {
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      icon: Shield,
      path: "/teacher/two-factor-auth",
      color: "bg-green-500"
    },
    {
      title: "Update Profile Information",
      description: "Edit your personal details and contact information",
      icon: User,
      path: "/teacher/profile-settings",
      color: "bg-purple-500"
    },
    {
      title: "Deactivate Account",
      description: "Temporarily or permanently deactivate your account",
      icon: Power,
      path: "/teacher/deactivate-account",
      color: "bg-red-500"
    }
  ];

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile Options</h1>
            <p className="text-muted-foreground text-sm">Manage your account settings</p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid gap-4">
          {options.map((option) => (
            <Link key={option.title} to={option.path}>
              <Card className="shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4 sm:p-6">
                  <div className={`p-3 rounded-lg ${option.color} shadow-soft`}>
                    <option.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg mb-1">{option.title}</CardTitle>
                    <CardDescription className="text-sm">{option.description}</CardDescription>
                  </div>
                  <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileOptions;

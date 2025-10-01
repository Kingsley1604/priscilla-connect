import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, User, Mail, Phone, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const AdminProfileSettings = () => {
  const [formData, setFormData] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@priscillaschool.com",
    phone: "+234 123 456 7890",
    adminId: "ADM001",
    department: "Administration"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    toast.success("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Profile Settings</h1>
              <p className="text-white/90">Manage your administrator profile</p>
            </div>
          </div>
        </div>
      </header>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Picture */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>Update your profile photo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                  {formData.firstName[0]}{formData.lastName[0]}
                </div>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminId">Admin ID</Label>
                  <Input
                    id="adminId"
                    name="adminId"
                    value={formData.adminId}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link to="/dashboard">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminProfileSettings;
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingScreen";

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Student Information
    profilePicture: null as File | null,
    fullName: user?.name || "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    homeAddress: "",
    phone: "",
    email: user?.email || "",

    // Step 2: Academic Details
    currentAcademicSession: "",
    classGrade: "",
    previousSchool: "",
    previousClass: "",
    preferredLanguage: "",

    // Step 3: Parent/Guardian Information
    parentName: "",
    parentRelationship: "",
    parentPhone: "",
    parentEmail: "",
    parentOccupation: "",
    parentAddress: "",

    // Step 4: Emergency Contact
    emergencyContactName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    emergencyAltPhone: "",

    // Step 5: Medical Information
    hasMedicalConditions: false,
    medicalDetails: "",
    preferredHospital: "",
    doctorContact: "",

    // Step 6: Consent
    consentInfoUsage: false,
    consentTerms: false,
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.consentInfoUsage || !formData.consentTerms) {
      toast.error("Please accept all consent declarations");
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.fullName,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          nationality: formData.nationality,
          home_address: formData.homeAddress,
          current_academic_session: formData.currentAcademicSession,
          class_grade: formData.classGrade,
          previous_school: formData.previousSchool,
          previous_class: formData.previousClass,
          preferred_language: formData.preferredLanguage,
          parent_guardian_name: formData.parentName,
          parent_relationship: formData.parentRelationship,
          parent_phone: formData.parentPhone,
          parent_email: formData.parentEmail,
          parent_occupation: formData.parentOccupation,
          parent_address: formData.parentAddress,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_relationship: formData.emergencyRelationship,
          emergency_contact_phone: formData.emergencyPhone,
          emergency_alt_phone: formData.emergencyAltPhone,
          has_medical_conditions: formData.hasMedicalConditions,
          medical_details: formData.medicalDetails,
          preferred_hospital: formData.preferredHospital,
          doctor_contact: formData.doctorContact,
          consent_info_usage: formData.consentInfoUsage,
          consent_terms: formData.consentTerms,
          is_profile_complete: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile completed successfully!");
      navigate('/');
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast.error("Failed to complete profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to Priscilla Connect!</h1>
            <p className="text-muted-foreground">
              Please complete the form below accurately. All fields marked with an asterisk (*) are required.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-12 rounded-full transition-colors ${
                    step === currentStep
                      ? 'bg-primary'
                      : step < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "1. Student Information"}
              {currentStep === 2 && "2. Parent/Guardian Information"}
              {currentStep === 3 && "3. Emergency Contact"}
              {currentStep === 4 && "4. Medical Information"}
              {currentStep === 5 && "5. Consent & Declaration"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Student Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData(prev => ({ ...prev, profilePicture: e.target.files?.[0] || null }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth (DD/MM/YYYY) *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="homeAddress">Home Address *</Label>
                  <Textarea
                    id="homeAddress"
                    value={formData.homeAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, homeAddress: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Parent/Guardian Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="parentName">Full Name of Parent/Guardian *</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="parentRelationship">Relationship to Student *</Label>
                  <Input
                    id="parentRelationship"
                    value={formData.parentRelationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentRelationship: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentPhone">Phone Number *</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentEmail">Email Address *</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="parentOccupation">Occupation *</Label>
                  <Input
                    id="parentOccupation"
                    value={formData.parentOccupation}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentOccupation: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="parentAddress">Home Address (if different from student)</Label>
                  <Textarea
                    id="parentAddress"
                    value={formData.parentAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentAddress: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergencyContactName">Name *</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyRelationship">Relationship to Student *</Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyRelationship: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyPhone">Phone Number *</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyAltPhone">Alternate Contact Number</Label>
                    <Input
                      id="emergencyAltPhone"
                      type="tel"
                      value={formData.emergencyAltPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyAltPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Medical Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasMedicalConditions"
                    checked={formData.hasMedicalConditions}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasMedicalConditions: checked as boolean }))}
                  />
                  <Label htmlFor="hasMedicalConditions">
                    Does the student have any medical conditions or allergies? *
                  </Label>
                </div>
                {formData.hasMedicalConditions && (
                  <div>
                    <Label htmlFor="medicalDetails">Please specify:</Label>
                    <Textarea
                      id="medicalDetails"
                      value={formData.medicalDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, medicalDetails: e.target.value }))}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="preferredHospital">Preferred Hospital/Clinic</Label>
                  <Input
                    id="preferredHospital"
                    value={formData.preferredHospital}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredHospital: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="doctorContact">Doctor's Name & Contact</Label>
                  <Input
                    id="doctorContact"
                    value={formData.doctorContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, doctorContact: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Consent & Declaration */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consentDeclaration"
                      checked={formData.consentInfoUsage}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consentInfoUsage: checked as boolean }))}
                    />
                    <Label htmlFor="consentDeclaration" className="leading-normal">
                      I hereby declare that the information provided above is true and accurate to the best of my knowledge.
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consentUsage"
                      checked={formData.consentTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consentTerms: checked as boolean }))}
                    />
                    <Label htmlFor="consentUsage" className="leading-normal">
                      I consent to the use of my child's information for academic and administrative purposes within Priscilla Connect.
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By clicking "Submit", I agree to the terms and conditions of Priscilla Connect.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !formData.consentInfoUsage || !formData.consentTerms}
                  className="ml-auto"
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      Submit
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCompletion;

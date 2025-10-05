import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ExamSetup = () => {
  const navigate = useNavigate();
  
  const [browserSettings, setBrowserSettings] = useState({
    disableRightClick: false,
    disableCopyPaste: false,
    disableTranslate: false,
    disableAutocomplete: false,
    disableSpellcheck: false,
    disablePrinting: false
  });

  const [notificationSetting, setNotificationSetting] = useState("account");
  const [customEmail, setCustomEmail] = useState("");

  const handleSave = () => {
    if (notificationSetting === "custom" && !customEmail) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success("Settings saved successfully!");
    navigate('/teacher/exam-builder');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/teacher/exam-overview')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Test Setup</h1>
        </div>

        {/* Browser Functionality */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Functionality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rightClick"
                  checked={browserSettings.disableRightClick}
                  onCheckedChange={(checked) => 
                    setBrowserSettings(prev => ({ ...prev, disableRightClick: !!checked }))
                  }
                />
                <Label htmlFor="rightClick" className="text-sm font-normal cursor-pointer">
                  Disable right-click context menu
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copyPaste"
                  checked={browserSettings.disableCopyPaste}
                  onCheckedChange={(checked) => 
                    setBrowserSettings(prev => ({ ...prev, disableCopyPaste: !!checked }))
                  }
                />
                <Label htmlFor="copyPaste" className="text-sm font-normal cursor-pointer">
                  Disable copy/paste
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="translate"
                  checked={browserSettings.disableTranslate}
                  onCheckedChange={(checked) => 
                    setBrowserSettings(prev => ({ ...prev, disableTranslate: !!checked }))
                  }
                />
                <Label htmlFor="translate" className="text-sm font-normal cursor-pointer">
                  Disable translate
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autocomplete"
                  checked={browserSettings.disableAutocomplete}
                  onCheckedChange={(checked) => 
                    setBrowserSettings(prev => ({ ...prev, disableAutocomplete: !!checked }))
                  }
                />
                <Label htmlFor="autocomplete" className="text-sm font-normal cursor-pointer">
                  Disable autocomplete
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="spellcheck"
                  checked={browserSettings.disableSpellcheck}
                  onCheckedChange={(checked) => 
                    setBrowserSettings(prev => ({ ...prev, disableSpellcheck: !!checked }))
                  }
                />
                <Label htmlFor="spellcheck" className="text-sm font-normal cursor-pointer">
                  Disable spellcheck
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="printing"
                  checked={browserSettings.disablePrinting}
                  onCheckedChange={(checked) => 
                    setBrowserSettings(prev => ({ ...prev, disablePrinting: !!checked }))
                  }
                />
                <Label htmlFor="printing" className="text-sm font-normal cursor-pointer">
                  Disable printing
                </Label>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Priscilla Connect doesn't guarantee full test security through these settings. 
                They only offer basic protection and can be bypassed easily. Also, some settings 
                may not work on all browsers or may affect accessibility for users with disabilities.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Do you want to receive an email whenever someone finishes this test?
            </p>
            
            <RadioGroup value={notificationSetting} onValueChange={setNotificationSetting}>
              <div className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value="account" id="account" />
                <Label htmlFor="account" className="text-sm font-normal cursor-pointer">
                  Use my account settings to control this
                </Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="text-sm font-normal cursor-pointer">
                    Yes, and send them to:
                  </Label>
                </div>
                {notificationSetting === "custom" && (
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="ml-6"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="text-sm font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamSetup;

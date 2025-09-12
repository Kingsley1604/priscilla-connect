import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon = ({ title, description = "This feature is currently under development" }: ComingSoonProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-white/90">{description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-soft border-dashed border-2 border-muted">
            <CardContent className="py-16 text-center">
              <div className="flex justify-center items-center mb-6">
                <div className="relative">
                  <Clock className="h-20 w-20 text-muted-foreground" />
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Coming Soon!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We're working hard to bring you this amazing feature. Stay tuned for updates!
              </p>
              <div className="flex justify-center">
                <Link to="/">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Feature Preview */}
          <Card className="mt-8 shadow-soft bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">What to Expect</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Enhanced user experience with intuitive design</li>
                <li>• Advanced functionality tailored to your needs</li>
                <li>• Seamless integration with existing features</li>
                <li>• Regular updates and improvements</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ComingSoon;
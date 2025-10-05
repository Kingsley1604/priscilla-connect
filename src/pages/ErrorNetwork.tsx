import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, RefreshCw, WifiOff } from "lucide-react";

const ErrorNetwork = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <WifiOff className="h-24 w-24 text-warning mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-warning mb-2">No Connection</h1>
          <div className="h-1 w-32 bg-gradient-primary mx-auto rounded-full mt-4"></div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Network Error</h2>
        <p className="text-lg text-muted-foreground mb-8">
          You're offline. Please check your internet connection.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Homepage
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNetwork;

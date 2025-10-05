import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { WifiOff } from "lucide-react";

const ErrorNetwork = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8 flex justify-center">
          <div className="p-6 rounded-full bg-muted">
            <WifiOff className="h-20 w-20 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">No Internet Connection</h2>
        <p className="text-lg text-muted-foreground mb-8">
          You're offline. Please check your internet connection.
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
          >
            Return to Homepage
          </Button>
          <Button 
            variant="outline"
            onClick={handleRefresh}
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorNetwork;
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, RefreshCw, ServerCrash } from "lucide-react";

const Error500 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <ServerCrash className="h-24 w-24 text-destructive mx-auto mb-4" />
          <h1 className="text-9xl font-bold text-destructive mb-2">500</h1>
          <div className="h-1 w-32 bg-gradient-primary mx-auto rounded-full"></div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Server Error</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Hmm... looks like something's not right. We're fixing it — please try again in a bit!
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
          <p className="text-sm text-muted-foreground mt-4">
            If the problem persists, please contact us at contact.ktech@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Error500;

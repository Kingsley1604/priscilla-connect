import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Error500 = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-2">500</h1>
          <div className="h-1 w-32 bg-gradient-primary mx-auto rounded-full"></div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Server Error</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Hmm... looks like something's not right. We're fixing it — please try again in a bit!
        </p>
        <div className="flex gap-4 justify-center mb-4">
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
        <p className="text-sm text-muted-foreground mt-4">
          If the problem persists, please contact us at contact.ktech@gmail.com
        </p>
      </div>
    </div>
  );
};

export default Error500;
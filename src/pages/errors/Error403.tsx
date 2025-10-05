import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Error403 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-2">403</h1>
          <div className="h-1 w-32 bg-gradient-primary mx-auto rounded-full"></div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Access Denied</h2>
        <p className="text-lg text-muted-foreground mb-8">
          You don't have access to this page. If you think this is a mistake, please contact your admin.
        </p>
        <Button 
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Error403;
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Lock } from "lucide-react";

const Error401 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <Lock className="h-24 w-24 text-warning mx-auto mb-4" />
          <h1 className="text-9xl font-bold text-warning mb-2">401</h1>
          <div className="h-1 w-32 bg-gradient-primary mx-auto rounded-full"></div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Unauthorized</h2>
        <p className="text-lg text-muted-foreground mb-8">
          We couldn't find the page you're looking for. It might have been moved or no longer exists.
        </p>
        <Button 
          onClick={() => navigate('/dashboard')}
          size="lg"
          className="gap-2"
        >
          <Home className="h-5 w-5" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Error401;

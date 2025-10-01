import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-2">404</h1>
          <div className="h-1 w-32 bg-gradient-primary mx-auto rounded-full"></div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Oops!</h2>
        <p className="text-xl text-muted-foreground mb-8">
          The page you're looking for doesn't exist.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          The page might have been moved or deleted, or you may have typed the wrong URL.
        </p>
        <a 
          href="/" 
          className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

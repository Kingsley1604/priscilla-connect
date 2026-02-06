import logo from "@/assets/priscilla-connect-logo.svg";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <img 
          src={logo} 
          alt="Priscilla Connect Logo" 
          className="w-40 h-40 mx-auto mb-4 animate-pulse rounded-full object-cover"
        />
        <h2 className="text-2xl font-bold text-foreground mb-2">Priscilla Connect</h2>
        <p className="text-muted-foreground">Loading...</p>
        <div className="mt-4">
          <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
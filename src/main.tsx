import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import App from './App.tsx'
import LoadingScreen from './components/LoadingScreen'
import './index.css'

const AppWithLoading = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <App />
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(<AppWithLoading />);

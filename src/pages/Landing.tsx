import { GraduationCap, Users, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import priscillaLogo from "@/assets/priscilla-connect-logo.svg";

interface LandingProps {
  onSelectRole: (role: 'student' | 'teacher' | 'admin') => void;
}

const Landing = ({ onSelectRole }: LandingProps) => {
  const roles = [
    {
      id: 'student' as const,
      title: 'Student Portal',
      description: 'Access your reports, homework assistant, educational videos, and achievements.',
      icon: GraduationCap,
      color: 'from-pink-500 to-pink-600',
    },
    {
      id: 'teacher' as const,
      title: 'Teacher Dashboard',
      description: 'Manage classes, track student performance, and upload educational content.',
      icon: Users,
      color: 'from-gray-500 to-gray-600',
    },
    {
      id: 'admin' as const,
      title: 'Admin Panel',
      description: 'Oversee school operations, manage users, and configure system settings.',
      icon: Settings,
      color: 'from-pink-600 to-pink-700',
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gradient-hero flex flex-col items-center justify-center px-4 sm:px-6 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="text-center mb-8 sm:mb-12 animate-fade-in max-w-4xl">
        <div className="inline-flex items-center justify-center rounded-full mb-6 backdrop-blur-sm overflow-hidden">
          <img src={priscillaLogo} alt="Priscilla Connect" className="h-20 w-20 sm:h-24 sm:w-24 object-cover" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-3">
          Priscilla Connect
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground dark:text-white/90 font-medium mb-2 block">
          Empowering Education Through Technology
        </p>
        <p className="text-sm sm:text-base text-muted-foreground dark:text-white/80 max-w-2xl mx-auto">
          A comprehensive school management system designed to connect students, teachers, and administrators in a seamless educational experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl w-full mb-8">
        {roles.map((role, index) => (
          <Card
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            className="group cursor-pointer bg-card dark:bg-white/10 backdrop-blur-sm border border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl p-6 text-center animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`inline-flex items-center justify-center p-4 rounded-full mb-4 bg-gradient-to-br ${role.color}`}>
              <role.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground dark:text-white mb-2">
              {role.title}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-white/80 leading-relaxed">
              {role.description}
            </p>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground dark:text-white/70 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
        Select your role to explore the Priscilla Connect experience
      </p>
    </div>
  );
};

export default Landing;

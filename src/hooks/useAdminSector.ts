import { useAuth } from './useAuth';

// Task H: Fixed class level definitions
// Primary school classes: Play group, Nursery, Primary 1-6
const PRIMARY_LEVELS = [
  'Play Group 1', 'Play Group 2',
  'Nursery 1', 'Nursery One', 'Nursery 2', 'Nursery Two',
  'Primary 1', 'First Grade', 
  'Primary 2', 'Second Grade',
  'Primary 3', 'Third Grade',
  'Primary 4', 'Fourth Grade',
  'Primary 5', 'Fifth Grade',
  'Primary 6', 'Sixth Grade'
];

// Secondary school classes: JSS 1-3, SS 1-3
const SECONDARY_LEVELS = [
  'JSS 1', 'JSS 2', 'JSS 3',
  'Junior Secondary', 'Seventh Grade', 'Eighth Grade', 'Ninth Grade',
  'SS 1', 'SS 2', 'SS 3',
  'SSS 1', 'SSS 2', 'SSS 3',
  'Senior Secondary', 'Tenth Grade', 'Eleventh Grade', 'Twelfth Grade'
];

export const useAdminSector = () => {
  const { user } = useAuth();
  
  // Get admin's sector from profile
  const adminSector = user?.sector || null;
  const isSuperAdmin = user?.is_super_admin || false;
  const userRole = user?.role || 'student';
  
  // Check if admin can manage a specific sector
  const canManageSector = (targetSector: string): boolean => {
    if (isSuperAdmin) return true;
    if (!adminSector) return true; // No sector means can manage all
    return adminSector === targetSector || adminSector === 'both';
  };
  
  // Check if user can manage a specific class level (for teachers)
  const canManageClassLevel = (classLevel: string): boolean => {
    if (isSuperAdmin) return true;
    
    const userSector = user?.sector || adminSector;
    if (!userSector) return true;
    if (userSector === 'both') return true;
    
    const isPrimaryLevel = PRIMARY_LEVELS.some(level => 
      classLevel.toLowerCase().includes(level.toLowerCase()) ||
      level.toLowerCase().includes(classLevel.toLowerCase())
    );
    const isSecondaryLevel = SECONDARY_LEVELS.some(level => 
      classLevel.toLowerCase().includes(level.toLowerCase()) ||
      level.toLowerCase().includes(classLevel.toLowerCase())
    );
    
    if (userSector === 'primary') return isPrimaryLevel;
    if (userSector === 'secondary') return isSecondaryLevel;
    
    return true;
  };
  
  // Get sector from class level
  const getSectorFromClassLevel = (classLevel: string): string => {
    const isPrimaryLevel = PRIMARY_LEVELS.some(level => 
      classLevel.toLowerCase().includes(level.toLowerCase()) ||
      level.toLowerCase().includes(classLevel.toLowerCase())
    );
    if (isPrimaryLevel) return 'primary';
    
    const isSecondaryLevel = SECONDARY_LEVELS.some(level => 
      classLevel.toLowerCase().includes(level.toLowerCase()) ||
      level.toLowerCase().includes(classLevel.toLowerCase())
    );
    if (isSecondaryLevel) return 'secondary';
    
    return 'unknown';
  };
  
  // Filter class levels based on user's sector (for teachers and admins)
  const filterClassLevels = (levels: string[]): string[] => {
    if (isSuperAdmin) return levels;
    
    const userSector = user?.sector || adminSector;
    if (!userSector || userSector === 'both') return levels;
    
    if (userSector === 'primary') {
      return levels.filter(level => {
        const isPrimary = PRIMARY_LEVELS.some(pl => 
          level.toLowerCase().includes(pl.toLowerCase()) ||
          pl.toLowerCase().includes(level.toLowerCase())
        );
        return isPrimary;
      });
    }
    if (userSector === 'secondary') {
      return levels.filter(level => {
        const isSecondary = SECONDARY_LEVELS.some(sl => 
          level.toLowerCase().includes(sl.toLowerCase()) ||
          sl.toLowerCase().includes(level.toLowerCase())
        );
        return isSecondary;
      });
    }
    
    return levels;
  };
  
  // Filter teachers by sector
  const filterTeachersBySector = <T extends { sector?: string | null }>(teachers: T[]): T[] => {
    if (isSuperAdmin) return teachers;
    if (!adminSector || adminSector === 'both') return teachers;
    
    return teachers.filter(teacher => {
      if (!teacher.sector) return true; // Show teachers without sector
      return teacher.sector === adminSector || teacher.sector === 'both';
    });
  };
  
  // Filter students by class level/sector
  const filterStudentsBySector = <T extends { class_grade?: string | null }>(students: T[]): T[] => {
    if (isSuperAdmin) return students;
    if (!adminSector || adminSector === 'both') return students;
    
    return students.filter(student => {
      if (!student.class_grade) return true;
      return canManageClassLevel(student.class_grade);
    });
  };
  
  // Get allowed sectors for dropdown
  const getAllowedSectors = (): { value: string; label: string }[] => {
    if (isSuperAdmin || !adminSector || adminSector === 'both') {
      return [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'both', label: 'Both Sectors' }
      ];
    }
    
    if (adminSector === 'primary') {
      return [{ value: 'primary', label: 'Primary' }];
    }
    
    if (adminSector === 'secondary') {
      return [{ value: 'secondary', label: 'Secondary' }];
    }
    
    return [];
  };
  
  // Get class levels for current sector
  const getClassLevelsForSector = (): string[] => {
    if (isSuperAdmin || !adminSector || adminSector === 'both') {
      return [...PRIMARY_LEVELS.slice(0, 12), ...SECONDARY_LEVELS.slice(0, 9)]; // Unique values
    }
    
    if (adminSector === 'primary') {
      return ['Play Group 1', 'Play Group 2', 'Nursery 1', 'Nursery 2', 
              'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
    }
    
    if (adminSector === 'secondary') {
      return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    }
    
    return [];
  };
  
  return {
    adminSector,
    isSuperAdmin,
    userRole,
    canManageSector,
    canManageClassLevel,
    getSectorFromClassLevel,
    filterClassLevels,
    filterTeachersBySector,
    filterStudentsBySector,
    getAllowedSectors,
    getClassLevelsForSector,
    PRIMARY_LEVELS,
    SECONDARY_LEVELS
  };
};
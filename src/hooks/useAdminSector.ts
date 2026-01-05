import { useAuth } from './useAuth';

// Define which class levels belong to which sector
const PRIMARY_LEVELS = [
  'Nursery 1', 'Nursery 2',
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'
];

const SECONDARY_LEVELS = [
  'JSS 1', 'JSS 2', 'JSS 3',
  'SSS 1', 'SSS 2', 'SSS 3'
];

export const useAdminSector = () => {
  const { user } = useAuth();
  
  // Get admin's sector from profile
  const adminSector = user?.sector || null;
  const isSuperAdmin = user?.is_super_admin || false;
  
  // Check if admin can manage a specific sector
  const canManageSector = (targetSector: string): boolean => {
    if (isSuperAdmin) return true;
    if (!adminSector) return true; // No sector means can manage all
    return adminSector === targetSector || adminSector === 'both';
  };
  
  // Check if admin can manage a specific class level
  const canManageClassLevel = (classLevel: string): boolean => {
    if (isSuperAdmin) return true;
    if (!adminSector) return true;
    if (adminSector === 'both') return true;
    
    const isPrimaryLevel = PRIMARY_LEVELS.includes(classLevel);
    const isSecondaryLevel = SECONDARY_LEVELS.includes(classLevel);
    
    if (adminSector === 'primary') return isPrimaryLevel;
    if (adminSector === 'secondary') return isSecondaryLevel;
    
    return true;
  };
  
  // Get sector from class level
  const getSectorFromClassLevel = (classLevel: string): string => {
    if (PRIMARY_LEVELS.includes(classLevel)) return 'primary';
    if (SECONDARY_LEVELS.includes(classLevel)) return 'secondary';
    return 'unknown';
  };
  
  // Filter class levels based on admin's sector
  const filterClassLevels = (levels: string[]): string[] => {
    if (isSuperAdmin) return levels;
    if (!adminSector || adminSector === 'both') return levels;
    
    if (adminSector === 'primary') {
      return levels.filter(level => PRIMARY_LEVELS.includes(level));
    }
    if (adminSector === 'secondary') {
      return levels.filter(level => SECONDARY_LEVELS.includes(level));
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
        { value: 'secondary', label: 'Secondary' }
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
  
  return {
    adminSector,
    isSuperAdmin,
    canManageSector,
    canManageClassLevel,
    getSectorFromClassLevel,
    filterClassLevels,
    filterTeachersBySector,
    filterStudentsBySector,
    getAllowedSectors,
    PRIMARY_LEVELS,
    SECONDARY_LEVELS
  };
};

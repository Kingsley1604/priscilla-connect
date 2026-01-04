// Content Monitoring System with 4-level warning classification

export type WarningLevel = 'critical' | 'high' | 'moderate' | 'sensitive';

export interface ContentCheckResult {
  isBlocked: boolean;
  level: WarningLevel | null;
  foundWords: string[];
  action: 'block' | 'warn' | 'review' | 'flag' | null;
  message: string | null;
}

// Level 1 – Critical (Block Immediately)
// Vulgar/Explicit Words
const CRITICAL_WORDS = [
  'sex', 'pussy', 'dick', 'penis', 'vagina', 'boobs', 'fuck', 'shit', 
  'bastard', 'bitch', 'asshole', 'porn', 'nipple', 'suck', 'nude', 'nudes',
  'masturbate', 'rape', 'hack', 'hacking', 'exploit', 'crack password'
];

// Level 2 – High (Flag & Warn)
// Insulting/Abusive + Bullying/Threats
const HIGH_WORDS = [
  "you don't know anything", 'empty brain', 'empty vessel', 'fool', 'stupid',
  'idiot', 'useless', 'dumb', 'mumu', 'olodo', 'mad', "you're mad", 'crazy',
  'blockhead', 'retard', 'animal', "i'll beat you", "i'll kill you", "you'll see",
  'wait after school', 'i hate you', "i'll deal with you"
];

// Level 3 – Moderate (Flag for Review)
// Corrupt/Unethical Phrases
const MODERATE_WORDS = [
  'bribe me', 'pay me for first position', 'buy result', 'give me money to pass',
  "i'll fail you", 'mark for money', 'sex for grade'
];

// Level 4 – Sensitive (Contextual Flag)
// Racist/Tribal/Religious Hate
const SENSITIVE_WORDS = [
  'go back to your tribe', 'your religion is stupid', 'dirty hausa', 'dirty yoruba',
  'dirty igbo', "you're not a real christian", "you're not a real muslim"
];

export const checkContent = (content: string): ContentCheckResult => {
  const lowerContent = content.toLowerCase();
  
  // Check Critical words first (highest priority)
  const criticalFound = CRITICAL_WORDS.filter(word => 
    lowerContent.includes(word.toLowerCase())
  );
  
  if (criticalFound.length > 0) {
    return {
      isBlocked: true,
      level: 'critical',
      foundWords: criticalFound,
      action: 'block',
      message: `Message blocked: Contains explicit/vulgar content. This has been reported to administrators.`
    };
  }
  
  // Check High severity words
  const highFound = HIGH_WORDS.filter(word => 
    lowerContent.includes(word.toLowerCase())
  );
  
  if (highFound.length > 0) {
    return {
      isBlocked: false,
      level: 'high',
      foundWords: highFound,
      action: 'warn',
      message: `Warning: Your message contains insulting or threatening language. Please maintain respect in your communications.`
    };
  }
  
  // Check Moderate severity words
  const moderateFound = MODERATE_WORDS.filter(word => 
    lowerContent.includes(word.toLowerCase())
  );
  
  if (moderateFound.length > 0) {
    return {
      isBlocked: false,
      level: 'moderate',
      foundWords: moderateFound,
      action: 'review',
      message: `Warning: Your message has been flagged for admin review due to potentially unethical content.`
    };
  }
  
  // Check Sensitive words
  const sensitiveFound = SENSITIVE_WORDS.filter(word => 
    lowerContent.includes(word.toLowerCase())
  );
  
  if (sensitiveFound.length > 0) {
    return {
      isBlocked: false,
      level: 'sensitive',
      foundWords: sensitiveFound,
      action: 'flag',
      message: `Notice: Your message contains potentially sensitive content regarding race, tribe, or religion. Please be mindful.`
    };
  }
  
  // No issues found
  return {
    isBlocked: false,
    level: null,
    foundWords: [],
    action: null,
    message: null
  };
};

export const getLevelColor = (level: WarningLevel | null): string => {
  switch (level) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'moderate': return 'bg-yellow-500 text-black';
    case 'sensitive': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export const getLevelLabel = (level: WarningLevel | null): string => {
  switch (level) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'moderate': return 'Moderate';
    case 'sensitive': return 'Sensitive';
    default: return 'Unknown';
  }
};

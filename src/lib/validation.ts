import { z } from 'zod';

// Exam validation schemas
export const examSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  exam_type: z.enum(['entrance', 'cbt']),
  duration_minutes: z.number()
    .int("Duration must be a whole number")
    .min(10, "Duration must be at least 10 minutes")
    .max(300, "Duration cannot exceed 300 minutes"),
  randomize_questions: z.boolean(),
  class_level: z.string().min(1, "Class level is required"),
  grade: z.string().min(1, "Grade is required"),
});

export const questionSchema = z.object({
  question_text: z.string()
    .trim()
    .min(5, "Question must be at least 5 characters")
    .max(1000, "Question must not exceed 1000 characters"),
  option_a: z.string()
    .trim()
    .min(1, "Option A is required")
    .max(500, "Option must not exceed 500 characters"),
  option_b: z.string()
    .trim()
    .min(1, "Option B is required")
    .max(500, "Option must not exceed 500 characters"),
  option_c: z.string()
    .trim()
    .min(1, "Option C is required")
    .max(500, "Option must not exceed 500 characters"),
  option_d: z.string()
    .trim()
    .min(1, "Option D is required")
    .max(500, "Option must not exceed 500 characters"),
  correct_answer: z.enum(['a', 'b', 'c', 'd']),
});

// Store order validation schemas
export const storeOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive("Price must be positive"),
    quantity: z.number().int().positive("Quantity must be positive").max(100, "Quantity cannot exceed 100"),
  })).min(1, "Cart must contain at least one item"),
  total_amount: z.number()
    .positive("Total amount must be positive")
    .max(10000000, "Total amount exceeds maximum allowed"),
  delivery_address: z.string()
    .trim()
    .max(500, "Address must not exceed 500 characters")
    .nullable(),
  phone_number: z.string()
    .trim()
    .regex(/^\+?[\d\s\-()]{8,20}$/, "Invalid phone number format")
    .max(20, "Phone number must not exceed 20 characters"),
  notes: z.string()
    .trim()
    .max(1000, "Notes must not exceed 1000 characters")
    .nullable(),
});

// Announcement validation schemas
export const announcementSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  content: z.string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content must not exceed 5000 characters"),
  target_roles: z.array(z.enum(['student', 'teacher', 'admin']))
    .min(1, "At least one target role must be selected"),
});

// Event validation schemas
export const eventSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .refine((date) => {
      const eventDate = new Date(date);
      const minDate = new Date('1900-01-01');
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 10);
      return eventDate >= minDate && eventDate <= maxDate;
    }, "Date must be between 1900 and 10 years from now"),
  time: z.string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .nullable(),
  location: z.string()
    .trim()
    .max(200, "Location must not exceed 200 characters")
    .nullable(),
  type: z.enum(['event', 'exam', 'meeting']),
  description: z.string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .nullable(),
});

// Report card validation
export const reportCardSchema = z.object({
  student_name: z.string().trim().min(2).max(100),
  admission_no: z.string().trim().min(1).max(50),
  class_level: z.string().trim().min(1).max(50),
  term: z.string().trim().min(1).max(50),
  academic_session: z.string().trim().min(1).max(50),
  average_score: z.number().min(0).max(100).optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(),
});

// Inventory alert validation
export const inventoryAlertSchema = z.object({
  item_name: z.string().trim().min(2).max(200),
  current_stock: z.number().int().min(0),
  alert_threshold: z.number().int().min(1).max(10000),
});

// Student result validation
export const studentResultSchema = z.object({
  student_name: z.string().trim().min(2).max(100),
  admission_no: z.string().trim().min(1).max(50),
  subject: z.string().trim().min(2).max(100),
  half_term_score: z.number().min(0).max(100),
  exam_score: z.number().min(0).max(100),
  total_score: z.number().min(0).max(100),
  grade: z.string().min(1).max(10),
});

// Helper function to handle validation errors
export const handleValidationError = (error: z.ZodError): string => {
  return error.errors.map(err => err.message).join(', ');
};

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Trash2, AlertTriangle, CheckCircle, Download, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ExcelJS from "exceljs";

interface BulkStudentRow {
  id: string;
  fullName: string;
  admissionNo: string;
  email: string;
  classGrade: string;
  gender: string;
  dateOfBirth: string;
  parentGuardianName: string;
  errors: string[];
  isValid: boolean;
}

interface BulkStudentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  assignedClass: string | null;
  isClassTeacher: boolean;
  isAdmin: boolean;
  onSuccess: () => void;
}

const BulkStudentUpload = ({ isOpen, onClose, assignedClass, isClassTeacher, isAdmin, onSuccess }: BulkStudentUploadProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkStudentRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const validateRow = (row: Omit<BulkStudentRow, 'errors' | 'isValid' | 'id'>, allRows: BulkStudentRow[], existingAdmissionNos: Set<string>): string[] => {
    const errors: string[] = [];
    if (!row.fullName?.trim()) errors.push("Full Name is required");
    if (!row.admissionNo?.trim()) errors.push("Admission Number is required");
    if (!row.email?.trim()) errors.push("Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) errors.push("Invalid email format");

    // Check duplicate admission numbers within batch
    const dupeInBatch = allRows.filter(r => r.admissionNo?.trim() === row.admissionNo?.trim()).length;
    if (dupeInBatch > 0) errors.push("Duplicate Admission Number in file");

    // Check against existing
    if (existingAdmissionNos.has(row.admissionNo?.trim())) errors.push("Admission Number already exists");

    return errors;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      let jsonData: Record<string, any>[] = [];

      if (ext === 'csv') {
        const text = new TextDecoder().decode(data);
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          jsonData = lines.slice(1).map(line => {
            const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
            return obj;
          });
        }
      } else {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(data);
        const sheet = wb.worksheets[0];
        if (sheet) {
          const headers: string[] = [];
          sheet.getRow(1).eachCell((cell, col) => { headers[col - 1] = String(cell.value ?? '').trim(); });
          for (let r = 2; r <= sheet.rowCount; r++) {
            const row = sheet.getRow(r);
            const obj: Record<string, any> = {};
            let hasValue = false;
            headers.forEach((h, i) => {
              const v = row.getCell(i + 1).value;
              const str = v == null ? '' : (typeof v === 'object' && 'text' in (v as any) ? (v as any).text : String(v));
              if (str !== '') hasValue = true;
              obj[h] = str;
            });
            if (hasValue) jsonData.push(obj);
          }
        }
      }

      if (jsonData.length === 0) {
        toast.error("The file is empty");
        setIsUploading(false);
        return;
      }

      // Fetch existing admission numbers
      const { data: existingStudents } = await supabase
        .from('profiles')
        .select('admission_no')
        .not('admission_no', 'is', null);
      const existingAdmissionNos = new Set((existingStudents || []).map(s => s.admission_no).filter(Boolean));

      // Map columns (flexible matching)
      const parsedRows: BulkStudentRow[] = [];
      jsonData.forEach((rawRow, index) => {
        const keys = Object.keys(rawRow);
        const find = (patterns: string[]) => {
          const key = keys.find(k => patterns.some(p => k.toLowerCase().replace(/[_\s]/g, '').includes(p)));
          return key ? String(rawRow[key]).trim() : "";
        };

        const classGrade = isClassTeacher && assignedClass ? assignedClass : find(['class', 'grade', 'level']);
        
        const row: Omit<BulkStudentRow, 'errors' | 'isValid' | 'id'> = {
          fullName: find(['fullname', 'name', 'studentname']),
          admissionNo: find(['admission', 'admissionno', 'admissionnumber', 'admno']),
          email: find(['email', 'emailaddress']),
          classGrade,
          gender: find(['gender', 'sex']),
          dateOfBirth: find(['dob', 'dateofbirth', 'birthdate', 'birth']),
          parentGuardianName: find(['parent', 'guardian', 'parentname', 'guardianname']),
        };

        const errors = validateRow(row, parsedRows, existingAdmissionNos);
        parsedRows.push({
          ...row,
          id: `row-${index}`,
          errors,
          isValid: errors.length === 0
        });
      });

      setRows(parsedRows);
      const validCount = parsedRows.filter(r => r.isValid).length;
      const errorCount = parsedRows.length - validCount;
      toast.info(`Parsed ${parsedRows.length} rows: ${validCount} valid, ${errorCount} with errors`);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file");
    } finally {
      setIsUploading(false);
    }
  };

  const updateRow = (id: string, field: keyof BulkStudentRow, value: string) => {
    setRows(prev => {
      const updated = prev.map(r => {
        if (r.id !== id) return r;
        const newRow = { ...r, [field]: value };
        // Re-validate
        const otherRows = prev.filter(or => or.id !== id);
        const errors = validateRow(newRow, otherRows, new Set());
        return { ...newRow, errors, isValid: errors.length === 0 };
      });
      return updated;
    });
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to submit. Please fix errors and retry.");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    const failedRows: BulkStudentRow[] = [];

    for (const row of validRows) {
      try {
        const tempPassword = generatePassword();
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: row.email,
          password: tempPassword,
          options: { data: { name: row.fullName, role: 'student' }, emailRedirectTo: undefined }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        await supabase.from('profiles').update({
          name: row.fullName,
          admission_no: row.admissionNo,
          class_grade: row.classGrade,
          gender: row.gender || null,
          date_of_birth: row.dateOfBirth || null,
          parent_guardian_name: row.parentGuardianName || null,
          default_password: tempPassword,
          must_change_password: true
        }).eq('id', authData.user.id);

        successCount++;
      } catch (error: any) {
        failedRows.push({ ...row, errors: [error.message || "Failed to create"], isValid: false });
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} student(s) created successfully.`);
    }
    if (failedRows.length > 0) {
      toast.error(`${failedRows.length} student(s) failed. Check errors.`);
      setRows(prev => [...prev.filter(r => !r.isValid), ...failedRows]);
    } else {
      setRows([]);
      setFileName("");
      onSuccess();
      onClose();
    }

    setIsSubmitting(false);
  };

  const downloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Students");
    ws.addRow(["Full Name", "Admission Number", "Email", "Class", "Gender", "Date of Birth", "Parent/Guardian Name"]);
    ws.addRow(["", "", "", assignedClass || "", "", "", ""]);
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_upload_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.length - validCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to create multiple student accounts at once.
            {isClassTeacher && assignedClass && (
              <span className="block mt-1 text-primary font-medium">Students will be added to: {assignedClass}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {rows.length === 0 ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Drag and drop or click to upload CSV/Excel file</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? "Processing..." : "Choose File"}
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Required columns:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Full Name, Admission Number, Email</li>
                  <li>Optional: Class, Gender, Date of Birth, Parent/Guardian Name</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{fileName}</Badge>
                  <Badge variant="default">{validCount} valid</Badge>
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} errors</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={() => { setRows([]); setFileName(""); }}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={row.id} className={row.isValid ? "" : "bg-destructive/5"}>
                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={row.fullName}
                            onChange={(e) => updateRow(row.id, 'fullName', e.target.value)}
                            className={`h-8 text-xs ${row.errors.some(e => e.includes('Name')) ? 'border-destructive' : ''}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.admissionNo}
                            onChange={(e) => updateRow(row.id, 'admissionNo', e.target.value)}
                            className={`h-8 text-xs ${row.errors.some(e => e.includes('Admission')) ? 'border-destructive' : ''}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.email}
                            onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                            className={`h-8 text-xs ${row.errors.some(e => e.includes('email') || e.includes('Email')) ? 'border-destructive' : ''}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.classGrade}
                            onChange={(e) => updateRow(row.id, 'classGrade', e.target.value)}
                            className="h-8 text-xs"
                            readOnly={isClassTeacher && !!assignedClass}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.gender}
                            onChange={(e) => updateRow(row.id, 'gender', e.target.value)}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <span className="text-xs text-destructive truncate max-w-[120px]" title={row.errors.join(', ')}>
                                {row.errors[0]}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(row.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || validCount === 0}>
              {isSubmitting ? "Creating..." : `Create ${validCount} Student(s)`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkStudentUpload;

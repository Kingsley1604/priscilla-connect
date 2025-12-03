import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulkQuestionImportProps {
  examId: string;
  onImportComplete: () => void;
}

interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  isValid: boolean;
  error?: string;
}

const BulkQuestionImport = ({ examId, onImportComplete }: BulkQuestionImportProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = `question_text,option_a,option_b,option_c,option_d,correct_answer
"What is 2 + 2?","3","4","5","6","b"
"What is the capital of Nigeria?","Abuja","Lagos","Kano","Ibadan","a"
"Which planet is closest to the sun?","Earth","Venus","Mercury","Mars","c"`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  const parseCSV = (content: string): ParsedQuestion[] => {
    const lines = content.split("\n").filter(line => line.trim());
    const questions: ParsedQuestion[] = [];
    const errors: string[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(/("([^"]*)")|([^,]+)/g);
      
      if (!matches || matches.length < 6) {
        errors.push(`Row ${i + 1}: Invalid format - expected 6 columns`);
        continue;
      }

      const cleanValue = (val: string) => val.replace(/^"|"$/g, "").trim();
      
      const question_text = cleanValue(matches[0] || "");
      const option_a = cleanValue(matches[1] || "");
      const option_b = cleanValue(matches[2] || "");
      const option_c = cleanValue(matches[3] || "");
      const option_d = cleanValue(matches[4] || "");
      const correct_answer = cleanValue(matches[5] || "").toLowerCase() as "a" | "b" | "c" | "d";

      let isValid = true;
      let error = "";

      if (!question_text || question_text.length < 5) {
        isValid = false;
        error = "Question text too short";
      } else if (!option_a || !option_b || !option_c || !option_d) {
        isValid = false;
        error = "All options are required";
      } else if (!["a", "b", "c", "d"].includes(correct_answer)) {
        isValid = false;
        error = "Correct answer must be a, b, c, or d";
      }

      questions.push({
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        isValid,
        error
      });
    }

    setImportErrors(errors);
    return questions;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const questions = parseCSV(content);
      setParsedQuestions(questions);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validQuestions = parsedQuestions.filter(q => q.isValid);
    
    if (validQuestions.length === 0) {
      toast.error("No valid questions to import");
      return;
    }

    setIsUploading(true);
    try {
      // Get existing question count for ordering
      const { data: existingQuestions } = await supabase
        .from("exam_questions")
        .select("question_order")
        .eq("exam_id", examId)
        .order("question_order", { ascending: false })
        .limit(1);

      let startOrder = existingQuestions?.[0]?.question_order ?? 0;

      const questionsToInsert = validQuestions.map((q, index) => ({
        exam_id: examId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        question_order: startOrder + index + 1
      }));

      const { error } = await supabase
        .from("exam_questions")
        .insert(questionsToInsert);

      if (error) throw error;

      toast.success(`Successfully imported ${validQuestions.length} questions!`);
      setParsedQuestions([]);
      setImportErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onImportComplete();
    } catch (error) {
      toast.error("Failed to import questions");
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedQuestions.filter(q => q.isValid).length;
  const invalidCount = parsedQuestions.filter(q => !q.isValid).length;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Question Import
        </CardTitle>
        <CardDescription>
          Upload a CSV file to import multiple questions at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-upload">Upload CSV File</Label>
          <Input
            ref={fileInputRef}
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />
        </div>

        {parsedQuestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Alert variant={validCount > 0 ? "default" : "destructive"}>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Valid Questions</AlertTitle>
                <AlertDescription>{validCount} questions ready to import</AlertDescription>
              </Alert>
              
              {invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid Questions</AlertTitle>
                  <AlertDescription>{invalidCount} questions have errors</AlertDescription>
                </Alert>
              )}
            </div>

            {importErrors.length > 0 && (
              <div className="bg-destructive/10 p-3 rounded-lg text-sm">
                <p className="font-medium text-destructive mb-2">Import Errors:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {importErrors.map((error, index) => (
                    <li key={index} className="text-destructive">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Question</th>
                    <th className="p-2 text-left">Answer</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedQuestions.map((q, index) => (
                    <tr key={index} className={!q.isValid ? "bg-destructive/10" : ""}>
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 max-w-xs truncate">{q.question_text}</td>
                      <td className="p-2 uppercase">{q.correct_answer}</td>
                      <td className="p-2">
                        {q.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-destructive text-xs">{q.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              onClick={handleImport}
              disabled={validCount === 0 || isUploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Importing..." : `Import ${validCount} Questions`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkQuestionImport;

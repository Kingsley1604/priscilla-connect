import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EXAMS = ["waec", "jamb", "neco", "post-utme"];
const SUBJECTS = [
  "english", "mathematics", "biology", "chemistry", "physics",
  "economics", "government", "literature", "geography", "commerce",
  "accounting", "agriculture", "civic-education", "crk", "irk", "history",
];

interface Job {
  id: string;
  exam_type: string;
  subject: string;
  status: string;
  fetched_count: number;
  inserted_count: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

const PastQuestionsImport = () => {
  const [exam, setExam] = useState("waec");
  const [subject, setSubject] = useState("mathematics");
  const [total, setTotal] = useState(200);
  const [running, setRunning] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("past_questions_import_jobs" as any)
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);
    setJobs((data as any) || []);
  };

  useEffect(() => { loadJobs(); }, []);

  const runImport = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-past-questions", {
        body: { exam, subject, total, batchSize: 20 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Import failed");
      toast.success(`Imported ${data.inserted} new questions (fetched ${data.fetched})`);
      loadJobs();
    } catch (e: any) {
      toast.error(e.message || "Failed to start import");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin/super-admin-dashboard" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" /> Past Questions Importer
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import from ALOC</CardTitle>
            <CardDescription>
              Pulls real WAEC / JAMB / NECO past questions into the local database. Admin-only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <Select value={exam} onValueChange={setExam}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXAMS.map(e => <SelectItem key={e} value={e}>{e.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Questions to fetch</Label>
                <Input type="number" min={20} max={2000} step={20}
                  value={total} onChange={e => setTotal(Number(e.target.value) || 200)} />
              </div>
            </div>
            <Button onClick={runImport} disabled={running} className="w-full md:w-auto">
              {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</> : "Start Import"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Import Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No import jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map(j => (
                  <div key={j.id} className="flex items-center justify-between border rounded-md p-3 text-sm flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {j.status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                        j.status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> :
                        <Loader2 className="h-4 w-4 animate-spin" />}
                      <span className="font-medium uppercase">{j.exam_type}</span>
                      <span className="text-muted-foreground">/ {j.subject}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Fetched: {j.fetched_count}</Badge>
                      <Badge>Inserted: {j.inserted_count}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(j.started_at).toLocaleString()}
                      </span>
                    </div>
                    {j.error_message && (
                      <p className="w-full text-xs text-destructive">{j.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PastQuestionsImport;
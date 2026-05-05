import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Cloud, Loader2, RefreshCw, AlertTriangle, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const PastQuestionsDataSource = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<{ total: number; lastJob?: any }>({ total: 0 });
  const [failures, setFailures] = useState<any[]>([]);
  const [activeFailure, setActiveFailure] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) return;
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("is_super_admin")
        .eq("id", u.user.id)
        .maybeSingle();
      setIsSuperAdmin(Boolean((prof as any)?.is_super_admin));

      const { data: setting } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "past_questions_source")
        .maybeSingle();
      setUseSupabase(Boolean((setting as any)?.value?.useSupabaseData));

      const { count } = await supabase
        .from("past_questions" as any)
        .select("*", { count: "exact", head: true });
      const { data: lastJob } = await supabase
        .from("past_questions_import_jobs" as any)
        .select("*")
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setStats({ total: count || 0, lastJob });

      const { data: fails } = await supabase
        .from("import_failures" as any)
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(50);
      setFailures((fails as any[]) || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Realtime subscription for instant failure alerts
    const ch = supabase
      .channel("import_failures_rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "import_failures" },
        (payload: any) => {
          setFailures((cur) => [payload.new, ...cur].slice(0, 50));
          toast.error("Background import failed. Click here for details.", {
            action: { label: "View", onClick: () => setActiveFailure(payload.new) },
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function archiveFailure(id: string) {
    try {
      const { error } = await supabase
        .from("import_failures" as any)
        .update({ archived: true })
        .eq("id", id);
      if (error) throw error;
      setFailures((cur) => cur.filter((f) => f.id !== id));
      setActiveFailure(null);
      toast.success("Archived");
    } catch (e: any) {
      toast.error(e?.message || "Failed to archive");
    }
  }

  async function toggle(next: boolean) {
    if (!isSuperAdmin) {
      toast.error("Only the super admin can change this.");
      return;
    }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("app_settings" as any)
        .upsert({
          key: "past_questions_source",
          value: { useSupabaseData: next },
          updated_at: new Date().toISOString(),
          updated_by: u?.user?.id ?? null,
        }, { onConflict: "key" });
      if (error) throw error;
      setUseSupabase(next);
      toast.success(next ? "Switched to Supabase data source." : "Switched to live API source.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function runImport() {
    setImporting(true);
    try {
      // Primary path: supabase-js invoke
      const invoke = await supabase.functions.invoke("auto-import-past-questions", { body: {} });
      if (invoke.error) {
        // Fallback to a direct fetch — invoke() can return a generic
        // "Failed to send a request to the Edge Function" when the
        // function returns non-200 with a JSON error body.
        const SUPABASE_URL = "https://fctarpegeatdizeuzzyb.supabase.co";
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/auto-import-past-questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: (supabase as any)?.supabaseKey ?? "",
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Import failed (${res.status}): ${txt.slice(0, 200) || invoke.error.message}`);
        }
      }
      toast.success("Background import started. This can take a few minutes.");
      setTimeout(load, 3000);
    } catch (e: any) {
      toast.error(e?.message || "Failed to start import");
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin/super-admin-dashboard" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-semibold">Past Questions — Data Source</h1>
          <div />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {!isSuperAdmin && (
          <Card>
            <CardContent className="p-4 text-sm text-destructive">
              You do not have permission to change this setting. Super admin only.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {useSupabase ? <Database className="h-5 w-5" /> : <Cloud className="h-5 w-5" />}
              Active source: {useSupabase ? "Supabase" : "Live API (ALOC)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              While set to <b>Live API</b>, students fetch questions directly from the
              ALOC service and answers are also synced into Supabase in the background.
              Once the bulk import is complete, flip this switch to read entirely from
              Supabase and reduce API costs.
            </p>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium text-sm">Use Supabase as source</p>
                <p className="text-xs text-muted-foreground">Super admin only</p>
              </div>
              <Switch
                checked={useSupabase}
                disabled={!isSuperAdmin || saving}
                onCheckedChange={toggle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Imported questions</p>
                <p className="text-2xl font-semibold">{stats.total.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Last import</p>
                <p className="font-medium">
                  {stats.lastJob?.finished_at
                    ? new Date(stats.lastJob.finished_at).toLocaleString()
                    : "—"}
                </p>
                {stats.lastJob?.status && (
                  <Badge variant="secondary" className="mt-1">{stats.lastJob.status}</Badge>
                )}
              </div>
            </div>

            <Button onClick={runImport} disabled={importing || !isSuperAdmin} className="w-full">
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Run background import now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Recent failures ({failures.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failures.length === 0 && (
              <p className="text-sm text-muted-foreground">No failures recorded.</p>
            )}
            {failures.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFailure(f)}
                className="w-full text-left rounded-md border p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.error_message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(f.created_at).toLocaleString()}
                      {f.exam_type ? ` · ${f.exam_type.toUpperCase()}` : ""}
                      {f.student_name ? ` · ${f.student_name}` : ""}
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0">failure</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!activeFailure} onOpenChange={(o) => !o && setActiveFailure(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import failure details</DialogTitle>
            <DialogDescription>
              {activeFailure?.created_at && new Date(activeFailure.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {activeFailure && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Error message</p>
                <p className="font-medium">{activeFailure.error_message}</p>
              </div>
              {activeFailure.error_details && (
                <div>
                  <p className="text-xs text-muted-foreground">Details / stack</p>
                  <pre className="bg-muted rounded p-2 text-xs whitespace-pre-wrap break-all max-h-48 overflow-auto">
                    {activeFailure.error_details}
                  </pre>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-muted-foreground">Exam type</p><p>{activeFailure.exam_type || "—"}</p></div>
                <div><p className="text-muted-foreground">Subjects</p><p>{(activeFailure.subjects || []).join(", ") || "—"}</p></div>
                <div><p className="text-muted-foreground">Student ID</p><p className="break-all">{activeFailure.student_id || "—"}</p></div>
                <div><p className="text-muted-foreground">Student name</p><p>{activeFailure.student_name || "—"}</p></div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => archiveFailure(activeFailure.id)}>
                <Archive className="h-4 w-4 mr-2" /> Dismiss / Archive
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PastQuestionsDataSource;

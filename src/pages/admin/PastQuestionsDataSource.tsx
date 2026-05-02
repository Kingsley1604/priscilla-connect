import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Cloud, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PastQuestionsDataSource = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<{ total: number; lastJob?: any }>({ total: 0 });

  async function load() {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) return;
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("is_super_admin")
        .eq("user_id", u.user.id)
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
      const { error } = await supabase.functions.invoke("auto-import-past-questions", { body: {} });
      if (error) throw error;
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
      </main>
    </div>
  );
};

export default PastQuestionsDataSource;

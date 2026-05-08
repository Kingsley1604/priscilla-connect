import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import priscillaLogo from "@/assets/priscilla-connect-logo.svg";

const ACCESS_ID_RE = /^PCN-[A-Z0-9]{6}$/;

const StudentLogin = () => {
  const navigate = useNavigate();
  const [accessId, setAccessId] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [preview, setPreview] = useState<{ name: string; class_grade: string | null; sector: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const id = accessId.trim().toUpperCase();
    if (!ACCESS_ID_RE.test(id)) {
      setError("Access ID must look like PCN-XXXXXX (6 letters/digits).");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc("preview_access_id", { _access_id: id } as any);
      if (rpcErr) throw rpcErr;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setError("No active student found for this Access ID.");
        return;
      }
      setPreview(row as any);
      setAccessId(id);
      setStep("confirm");
    } catch (err: any) {
      setError(err?.message || "Lookup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("student-access-login", {
        body: { access_id: accessId },
      });
      if (fnErr) throw fnErr;
      if (!data?.token_hash || !data?.email) {
        setError(data?.error || "Unable to start session.");
        return;
      }
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: data.token_hash,
      });
      if (verifyErr) {
        setError(verifyErr.message);
        return;
      }
      toast.success(`Welcome, ${preview?.name || "student"}!`);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white hover:bg-white/20">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <img src={priscillaLogo} alt="Priscilla Connect" className="h-20 w-20 mx-auto" />
          <h1 className="text-3xl font-bold text-white mt-2">Student Access ID</h1>
          <p className="text-white/80 text-sm">Sign in with your unique Access ID</p>
        </div>
        <Card className="shadow-glow border-white/20 bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> {step === "enter" ? "Enter Access ID" : "Confirm Identity"}
            </CardTitle>
            <CardDescription className="text-white/80">
              {step === "enter"
                ? "Format: PCN-XXXXXX (6 letters/digits)."
                : "Confirm this is you to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-3 bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-white">{error}</AlertDescription>
              </Alert>
            )}
            {step === "enter" ? (
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aid" className="text-white">Access ID</Label>
                  <Input
                    id="aid"
                    value={accessId}
                    onChange={(e) => setAccessId(e.target.value.toUpperCase())}
                    placeholder="PCN-XXXXXX"
                    maxLength={10}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 uppercase tracking-wider"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-white text-primary hover:bg-white/90">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</> : "Continue"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-white/15 border border-white/20 p-4 text-white">
                  <p className="text-xs uppercase text-white/70">Name</p>
                  <p className="text-lg font-semibold">{preview?.name}</p>
                  <p className="text-xs uppercase text-white/70 mt-2">Class</p>
                  <p className="text-base">{preview?.class_grade || "—"}</p>
                  {preview?.sector && (
                    <>
                      <p className="text-xs uppercase text-white/70 mt-2">Section</p>
                      <p className="text-base capitalize">{preview.sector}</p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={submitting} onClick={() => { setStep("enter"); setPreview(null); }}>
                    Not me
                  </Button>
                  <Button onClick={handleConfirm} disabled={submitting} className="bg-white text-primary hover:bg-white/90">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, sign me in"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentLogin;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { SummaryEditor } from "@/components/SummaryEditor";
import { SummaryList } from "@/components/SummaryList";
import { SummaryView } from "@/components/SummaryView";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    setSelectedSummaryId(null);
    setShowEditor(false);
  };

  const handleSummaryCreated = () => {
    setShowEditor(false);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => setLoading(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-ai p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">AI Summaries</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditor(!showEditor);
                setSelectedSummaryId(null);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Riassunto
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Sidebar - History */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-card h-full overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Cronologia</h2>
              </div>
              <SummaryList
                selectedId={selectedSummaryId}
                onSelectSummary={(id) => {
                  setSelectedSummaryId(id);
                  setShowEditor(false);
                }}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3">
            {showEditor ? (
              <SummaryEditor onSummaryCreated={handleSummaryCreated} />
            ) : (
              <SummaryView summaryId={selectedSummaryId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

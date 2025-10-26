import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Summary {
  id: string;
  title: string;
  created_at: string;
}

interface SummaryListProps {
  selectedId: string | null;
  onSelectSummary: (id: string) => void;
  refreshTrigger: number;
}

export const SummaryList = ({ selectedId, onSelectSummary, refreshTrigger }: SummaryListProps) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSummaries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSummaries([]);
        return;
      }

      const { data, error } = await supabase
        .from('summaries')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error: any) {
      console.error('Error loading summaries:', error);
      toast.error("Errore nel caricamento dei riassunti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('summaries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'summaries'
        },
        () => {
          loadSummaries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Riassunto eliminato");
    } catch (error: any) {
      console.error('Error deleting summary:', error);
      toast.error("Errore nell'eliminazione");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nessun riassunto ancora</p>
        <p className="text-sm text-muted-foreground mt-2">Crea il tuo primo riassunto!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {summaries.map((summary, index) => (
          <Button
            key={summary.id}
            variant={selectedId === summary.id ? "secondary" : "ghost"}
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={() => onSelectSummary(summary.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{index + 1}.</span>
                <span className="font-medium truncate">{summary.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(summary.created_at), {
                  addSuffix: true,
                  locale: it
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 shrink-0"
              onClick={(e) => handleDelete(summary.id, e)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface SummaryViewProps {
  summaryId: string | null;
}

interface SummaryData {
  title: string;
  formatted_content: string;
  created_at: string;
}

export const SummaryView = ({ summaryId }: SummaryViewProps) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!summaryId) {
      setSummary(null);
      return;
    }

    const loadSummary = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('summaries')
          .select('title, formatted_content, created_at')
          .eq('id', summaryId)
          .single();

        if (error) throw error;
        setSummary(data);
      } catch (error: any) {
        console.error('Error loading summary:', error);
        toast.error("Errore nel caricamento del riassunto");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [summaryId]);

  if (!summaryId) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Seleziona un riassunto dalla cronologia</p>
          <p className="text-sm text-muted-foreground mt-2">oppure creane uno nuovo</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground">Caricamento...</p>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground">Riassunto non trovato</p>
      </Card>
    );
  }

  const renderFormattedContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Main title (numbered)
      if (/^\d+\.\s+/.test(trimmedLine)) {
        return (
          <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-primary">
            {trimmedLine}
          </h2>
        );
      }
      
      // Subtitle (lettered)
      if (/^[A-Z]\.\s+/.test(trimmedLine)) {
        return (
          <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-secondary">
            {trimmedLine}
          </h3>
        );
      }
      
      // Regular content
      if (trimmedLine) {
        return (
          <p key={index} className="mb-3 leading-relaxed">
            {trimmedLine}
          </p>
        );
      }
      
      // Empty line
      return <div key={index} className="h-2" />;
    });
  };

  return (
    <Card className="flex-1 p-6">
      <ScrollArea className="h-full pr-4">
        <div className="prose prose-sm max-w-none">
          <div className="mb-6 pb-4 border-b">
            <h1 className="text-3xl font-bold mb-2">{summary.title}</h1>
            <p className="text-sm text-muted-foreground">
              Creato il {new Date(summary.created_at).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className="space-y-2">
            {renderFormattedContent(summary.formatted_content)}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};

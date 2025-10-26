import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SummaryEditorProps {
  onSummaryCreated: () => void;
}

export const SummaryEditor = ({ onSummaryCreated }: SummaryEditorProps) => {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error("Inserisci del testo da analizzare");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Devi effettuare il login");
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-summary', {
        body: { content }
      });

      if (error) throw error;

      if (!data?.title || !data?.formatted_content) {
        throw new Error("Risposta non valida dall'AI");
      }

      // Save to database
      const { error: insertError } = await supabase
        .from('summaries')
        .insert({
          user_id: user.id,
          title: data.title,
          content: content,
          formatted_content: data.formatted_content
        });

      if (insertError) throw insertError;

      toast.success("Riassunto creato con successo!");
      setContent("");
      onSummaryCreated();
    } catch (error: any) {
      console.error('Error analyzing summary:', error);
      toast.error(error.message || "Errore durante l'analisi");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Crea Nuovo Riassunto</h2>
        </div>
        
        <Textarea
          placeholder="Scrivi o incolla il testo da riassumere qui..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] resize-none"
          disabled={isAnalyzing}
        />

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !content.trim()}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analizza e Formatta
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

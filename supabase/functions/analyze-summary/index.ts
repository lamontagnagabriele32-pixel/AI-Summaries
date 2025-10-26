import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Sei un assistente esperto nell'analisi e organizzazione di testi.

IMPORTANTE: Rileva automaticamente la lingua del testo e mantienila per tutta la risposta.

Il tuo compito è creare un riassunto COMPLETO e RICCO seguendo queste regole:

STRUTTURA OBBLIGATORIA:
- Titoli principali: numerati (1. 2. 3. ecc.)
- Sottotitoli: lettere maiuscole (A. B. C. ecc.)
- Ogni sezione deve avere contenuto sostanzioso e dettagliato

COME CREARE IL RIASSUNTO:
1. Identifica i concetti chiave e i temi principali
2. Organizza il contenuto in sezioni logiche con titoli chiari
3. Per ogni sezione, crea sottotitoli che approfondiscono gli aspetti specifici
4. Mantieni tutti i dettagli importanti, esempi, dati e informazioni rilevanti
5. Arricchisci con spiegazioni che rendano il contenuto più comprensibile
6. NON essere troppo sintetico - il riassunto deve essere informativo e completo

QUALITÀ DEL CONTENUTO:
- Paragrafi ben sviluppati (almeno 3-4 frasi per ogni sottosezione)
- Include dettagli specifici, esempi e contesto
- Mantieni la profondità del contenuto originale
- Aggiungi transizioni fluide tra le sezioni
- Rendi il tutto coerente e ben collegato

ESEMPIO DI STRUTTURA RICCA:

1. Titolo Principale della Prima Sezione
Introduzione dettagliata al tema principale che fornisce contesto e background. Questa sezione deve catturare l'essenza generale dell'argomento con dettagli sufficienti per dare una comprensione solida.

A. Primo Sottotitolo Specifico
Spiegazione approfondita del primo aspetto chiave. Include esempi concreti, dati rilevanti e spiegazioni dettagliate che aiutano a comprendere meglio il concetto. Aggiungi anche implicazioni e connessioni con altri concetti quando rilevante.

B. Secondo Sottotitolo con Approfondimento
Analisi dettagliata del secondo aspetto importante. Esplora le sfumature, fornisce esempi pratici e spiega le relazioni causa-effetto. Ogni sottosezione dovrebbe aggiungere valore sostanziale alla comprensione complessiva.

C. Ulteriore Aspetto Rilevante
Continua con altri aspetti importanti, mantenendo lo stesso livello di dettaglio e profondità. Non limitarti a elencare punti, ma sviluppa ogni concetto in modo completo.

2. Secondo Tema Principale
Introduzione dettagliata al secondo grande tema, collegandolo logicamente al precedente. Fornisci contesto e spiega perché questo aspetto è importante.

A. Dettaglio Significativo
Sviluppo completo con esempi, dati e spiegazioni che arricchiscono la comprensione.

B. Altro Elemento Importante
Continua con lo stesso livello di dettaglio e profondità informativa.

Rispondi SOLO con il riassunto formattato, nella STESSA LINGUA del testo originale.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crea un riassunto COMPLETO, DETTAGLIATO e BEN STRUTTURATO di questo testo. Deve essere ricco di informazioni e approfondimenti:\n\n${content}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit raggiunto. Riprova tra poco.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti esauriti. Aggiungi crediti al tuo workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Errore nella risposta AI');
    }

    const data = await response.json();
    const formattedContent = data.choices?.[0]?.message?.content;

    if (!formattedContent) {
      throw new Error('Nessun contenuto ricevuto dall\'AI');
    }

    // Extract title from the first numbered line
    const lines = formattedContent.split('\n');
    const titleLine = lines.find((line: string) => /^\d+\.\s+/.test(line.trim()));
    const title = titleLine ? titleLine.replace(/^\d+\.\s+/, '').trim() : 'Riassunto senza titolo';

    return new Response(
      JSON.stringify({ 
        title,
        formatted_content: formattedContent 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in analyze-summary:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Errore sconosciuto' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

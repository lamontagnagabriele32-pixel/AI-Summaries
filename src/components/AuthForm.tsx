import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogIn, UserPlus, Sparkles } from "lucide-react";

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export const AuthForm = ({ onAuthSuccess }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login effettuato con successo!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Registrazione completata! Ora puoi effettuare il login.");
      }
      onAuthSuccess();
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'autenticazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted to-background">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          {isLogin ? "Bentornato" : "Crea Account"}
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          {isLogin
            ? "Accedi per vedere i tuoi riassunti"
            : "Inizia a creare riassunti intelligenti"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              "Caricamento..."
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Accedi
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Registrati
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
            disabled={loading}
          >
            {isLogin
              ? "Non hai un account? Registrati"
              : "Hai già un account? Accedi"}
          </button>
        </div>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
      await signInWithGoogle();
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-lg rounded-3xl p-8 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Eventos</p>
            <h1 className="text-2xl font-semibold text-slate-900">Sistema de Gestão</h1>
            <p className="text-sm text-slate-500">Use sua conta corporativa para continuar</p>
          </div>
        </div>

        <div className="text-center text-sm text-slate-500">
          Autentique-se com sua conta Google corporativa para acessar o painel.
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.6-1.1 2.9-2.4 3.8v3.1h3.9c2.3-2.1 3.5-5.2 3.5-9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.8-3l-3.9-3c-1.1.7-2.5 1.2-3.9 1.2-3 0-5.6-2-6.5-4.7H1.3v3c1.9 3.9 6 6.5 10.7 6.5z"
            />
            <path
              fill="#FBBC05"
              d="M5.5 14.5c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.9H1.3C.5 8.5 0 10.2 0 12s.5 3.5 1.3 5.1l4.2-3.2z"
            />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4C17.9 1.3 15.2 0 12 0 7.3 0 3.2 2.6 1.3 6.9l4.2 3.3c.9-2.8 3.5-5.4 6.5-5.4z"
            />
          </svg>
          <span>{loadingGoogle ? "Redirecionando..." : "Entrar com Google"}</span>
        </button>

        <p className="text-xs text-center text-slate-500">
          Acesso restrito aos membros autorizados. Caso não consiga entrar, contate o administrador responsável.
        </p>
      </div>
    </div>
  );
};

export default Login;

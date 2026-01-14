import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-card border border-destructive/50 p-10 rounded-[3rem] max-w-md w-full shadow-2xl shadow-foreground/5 text-center transition-all animate-in zoom-in-95">
            <div className="p-4 bg-destructive/10 rounded-2xl w-fit mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-3 uppercase tracking-tighter leading-none">
              Hoppla!
            </h1>
            <p className="text-muted-foreground mb-10 font-medium">
              {this.state.error?.message ||
                "Ein unerwarteter Fehler ist aufgetreten."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-3 w-full bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95"
            >
              <RefreshCcw className="w-5 h-5" />
              App neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

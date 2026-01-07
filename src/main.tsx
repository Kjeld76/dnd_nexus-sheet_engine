import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { CharacterSheet } from "./screens/CharacterSheet";
import { CharacterList } from "./screens/CharacterList";
import { Compendium } from "./components/Compendium";
import { useCharacterStore } from "./lib/store";
import { useThemeStore } from "./lib/themeStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Book, User, Moon, Sun, Sparkles } from "lucide-react";

const App = () => {
  const { currentCharacter } = useCharacterStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showCompendium, setShowCompendium] = React.useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground transition-colors duration-500">
      <nav className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shadow-xl shadow-foreground/[0.02] shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 mr-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="font-serif italic font-black tracking-tighter text-xl">Nexus</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCompendium(false)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                !showCompendium 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <User className="w-4 h-4" />
              Charaktere
            </button>
            <button 
              onClick={() => setShowCompendium(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                showCompendium 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Book className="w-4 h-4" />
              Kompendium
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/20 shadow-inner"
            title={theme === 'dark' ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>
      
      <div className="flex-1 overflow-hidden relative">
        {showCompendium ? (
          <Compendium />
        ) : (
          currentCharacter ? <CharacterSheet /> : <CharacterList />
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);


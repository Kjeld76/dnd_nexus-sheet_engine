import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { CharacterSheet } from "./screens/CharacterSheet";
import { CharacterList } from "./screens/CharacterList";
import { Compendium } from "./components/Compendium";
import { useCharacterStore } from "./lib/store";
import { useThemeStore } from "./lib/themeStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Book, User, Moon, Sun } from "lucide-react";
import { NexusLogo } from "./components/NexusLogo";

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
    <div className="h-screen flex overflow-hidden bg-background text-foreground transition-colors duration-500">
      {/* Sidebar Navigation */}
      <aside className="w-20 flex flex-col items-center py-6 border-r border-border bg-surface/50 backdrop-blur-sm shrink-0 z-50">
        <div className="flex flex-col items-center gap-8 flex-1">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <NexusLogo size="medium" variant="icon" />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-4 flex-1">
            <button
              onClick={() => setShowCompendium(false)}
              className={`group relative p-3 rounded-xl transition-all ${
                !showCompendium
                  ? "bg-accent text-primary-foreground shadow-lg shadow-accent/30 dark:shadow-accent/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Charaktere"
            >
              <User
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  !showCompendium ? "" : "icon-glow"
                }`}
              />
            </button>

            <button
              onClick={() => setShowCompendium(true)}
              className={`group relative p-3 rounded-xl transition-all ${
                showCompendium
                  ? "bg-accent text-primary-foreground shadow-lg shadow-accent/30 dark:shadow-accent/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Kompendium"
            >
              <Book
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  showCompendium ? "" : "icon-glow"
                }`}
              />
            </button>
          </nav>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/50 hover:border-border"
            title={
              theme === "dark"
                ? "Zu hellem Design wechseln"
                : "Zu dunklem Design wechseln"
            }
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content - Full Width */}
      <main className="flex-1 overflow-hidden relative">
        {showCompendium ? (
          <Compendium />
        ) : currentCharacter ? (
          <CharacterSheet />
        ) : (
          <CharacterList />
        )}
      </main>
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

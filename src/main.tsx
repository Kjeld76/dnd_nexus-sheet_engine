import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { CharacterSheet } from "./screens/CharacterSheet";
import { CharacterList } from "./screens/CharacterList";
import { Compendium } from "./components/Compendium";
import { useCharacterStore } from "./lib/store";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Book, User } from "lucide-react";

const App = () => {
  const { currentCharacter } = useCharacterStore();
  const [showCompendium, setShowCompendium] = React.useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <nav className="bg-slate-900 border-b border-slate-800 p-2 flex gap-4">
        <button 
          onClick={() => setShowCompendium(false)}
          className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${!showCompendium ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <User className="w-4 h-4" />
          Charaktere
        </button>
        <button 
          onClick={() => setShowCompendium(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${showCompendium ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Book className="w-4 h-4" />
          Kompendium
        </button>
      </nav>
      
      <div className="flex-1 overflow-hidden">
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


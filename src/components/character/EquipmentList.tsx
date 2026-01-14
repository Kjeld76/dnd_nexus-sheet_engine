import React, { useState } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
}

interface Props {
  items: EquipmentItem[];
  onChange: (items: EquipmentItem[]) => void;
  placeholder: string;
}

export const EquipmentList: React.FC<Props> = ({
  items,
  onChange,
  placeholder,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const newItem: EquipmentItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      quantity: newItemQuantity,
    };

    onChange([...items, newItem]);
    setNewItemName("");
    setNewItemQuantity(1);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddItem();
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-10 text-sm bg-muted/30 border border-border rounded-lg px-3 focus:border-primary outline-none transition-colors"
        />
        <input
          type="number"
          min="1"
          value={newItemQuantity}
          onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
          className="w-16 h-10 text-sm text-center border border-border rounded-lg bg-muted/30 focus:border-primary outline-none transition-colors"
        />
        <button
          onClick={handleAddItem}
          className="px-4 h-10 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-bold"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-2 min-h-[100px] max-h-[600px] overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Keine Items
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
              <span className="flex-1 text-sm font-medium text-foreground">
                {item.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.quantity - 1)
                  }
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Anzahl -1"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value) || 1;
                    handleUpdateQuantity(item.id, newQty);
                  }}
                  className="w-12 px-1 py-1 text-xs text-center border border-border rounded bg-background focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.quantity + 1)
                  }
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Anzahl +1"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                title="Entfernen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

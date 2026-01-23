#!/usr/bin/env python3
"""
Exportiert alle Klassen-Daten aus der Datenbank in ein lesbares Format.
"""

import sqlite3
import json
import sys
from pathlib import Path

def export_classes_to_json(db_path="dnd-nexus.db", output_path="export_classes.json"):
    """Exportiert Klassen-Daten als strukturiertes JSON."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, data FROM core_classes ORDER BY LOWER(name)")
    classes = cursor.fetchall()
    
    export_data = []
    
    for class_id, class_name, data_str in classes:
        data = json.loads(data_str)
        
        class_export = {
            "id": class_id,
            "name": class_name,
            "hit_die": data.get("hit_die"),
            "primary_attributes": data.get("primary_attributes"),
            "saving_throws": data.get("saving_throws"),
            "skill_choices": data.get("skill_choices"),
            "tool_proficiencies": data.get("tool_proficiencies"),
            "weapon_proficiencies": data.get("weapon_proficiencies"),
            "armor_proficiencies": data.get("armor_proficiencies"),
            "multiclassing": data.get("multiclassing"),
            "features_by_level": data.get("features_by_level", {}),
            "subclasses": data.get("subclasses", [])
        }
        
        export_data.append(class_export)
    
    conn.close()
    
    # Exportiere als JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(export_data)} Klassen exportiert nach: {output_path}")
    return export_data

def export_classes_to_markdown(db_path="dnd-nexus.db", output_path="export_classes.md"):
    """Exportiert Klassen-Daten als Markdown-Dokument."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, data FROM core_classes ORDER BY LOWER(name)")
    classes = cursor.fetchall()
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# Klassen-Export\n\n")
        f.write(f"*Exportiert am: {Path(db_path).stat().st_mtime if Path(db_path).exists() else 'unbekannt'}*\n\n")
        f.write("---\n\n")
        
        for class_id, class_name, data_str in classes:
            data = json.loads(data_str)
            
            f.write(f"## {class_name}\n\n")
            f.write(f"**ID:** `{class_id}`\n\n")
            
            # Basis-Daten
            f.write("### Basis-Daten\n\n")
            f.write(f"- **Trefferwürfel:** W{data.get('hit_die', 'N/A')}\n")
            f.write(f"- **Hauptattribute:** {', '.join(data.get('primary_attributes', [])) if data.get('primary_attributes') else 'N/A'}\n")
            f.write(f"- **Rettungswürfe:** {', '.join(data.get('saving_throws', [])) if data.get('saving_throws') else 'N/A'}\n")
            f.write(f"- **Fertigkeitsauswahl:** {data.get('skill_choices', {}).get('choose', 'N/A')} aus {len(data.get('skill_choices', {}).get('from', []))} Optionen\n")
            
            if data.get('multiclassing'):
                mc = data['multiclassing']
                if mc.get('prerequisites'):
                    prereqs = [f"{p.get('attribute', '').upper()} {p.get('value', '')}+" for p in mc['prerequisites']]
                    f.write(f"- **Multiclassing Voraussetzungen:** {', '.join(prereqs)}\n")
            
            f.write("\n")
            
            # Features by Level
            features_by_level = data.get("features_by_level", {})
            if features_by_level:
                f.write("### Features nach Level\n\n")
                for level in sorted(features_by_level.keys(), key=lambda x: int(x) if x.isdigit() else 999):
                    features = features_by_level[level]
                    f.write(f"#### Level {level}\n\n")
                    for feat in features:
                        f.write(f"- **{feat.get('name', 'Unbekannt')}**\n")
                        if feat.get('description'):
                            desc = feat['description'].strip()
                            if desc:
                                # Ersetze Zeilenumbrüche für bessere Lesbarkeit
                                desc_lines = desc.split('\n')
                                for line in desc_lines:
                                    if line.strip():
                                        f.write(f"  {line.strip()}\n")
                        f.write("\n")
                f.write("\n")
            
            # Subklassen
            subclasses = data.get("subclasses", [])
            if subclasses:
                f.write("### Unterklassen\n\n")
                for sc in subclasses:
                    sc_name = sc.get('name', 'Unbekannt')
                    f.write(f"#### {sc_name}\n\n")
                    
                    sc_features = sc.get('features', {})
                    if sc_features:
                        for level in sorted(sc_features.keys(), key=lambda x: int(x) if x.isdigit() else 999):
                            features = sc_features[level]
                            f.write(f"**Level {level}:**\n\n")
                            for feat in features:
                                f.write(f"- **{feat.get('name', 'Unbekannt')}**\n")
                                if feat.get('description'):
                                    desc = feat['description'].strip()
                                    if desc:
                                        desc_lines = desc.split('\n')
                                        for line in desc_lines:
                                            if line.strip():
                                                f.write(f"  {line.strip()}\n")
                                f.write("\n")
                    f.write("\n")
            
            f.write("---\n\n")
    
    conn.close()
    
    print(f"✅ {len(classes)} Klassen exportiert nach: {output_path}")

if __name__ == "__main__":
    db_path = sys.argv[1] if len(sys.argv) > 1 else "dnd-nexus.db"
    json_output = sys.argv[2] if len(sys.argv) > 2 else "export_classes.json"
    md_output = sys.argv[3] if len(sys.argv) > 3 else "export_classes.md"
    
    print(f"📖 Lade Klassen aus: {db_path}\n")
    
    # Exportiere als JSON
    export_classes_to_json(db_path, json_output)
    
    # Exportiere als Markdown
    export_classes_to_markdown(db_path, md_output)
    
    print(f"\n📄 Dateien erstellt:")
    print(f"   - {json_output} (strukturiertes JSON)")
    print(f"   - {md_output} (lesbares Markdown)")

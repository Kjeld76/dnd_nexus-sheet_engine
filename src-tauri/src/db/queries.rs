// Hier werden später spezifische Prepared Statement Helfer implementiert.
// Derzeit dient die Datei als Platzhalter für zukünftige Datenbankabfragen.

pub const SELECT_ALL_CHARACTERS: &str = "SELECT id, data FROM characters ORDER BY updated_at DESC";
pub const INSERT_CHARACTER: &str = "INSERT INTO characters (id, data) VALUES (?, ?)";
pub const UPDATE_CHARACTER: &str = "UPDATE characters SET data = ?, updated_at = (unixepoch()) WHERE id = ?";
pub const DELETE_CHARACTER: &str = "DELETE FROM characters WHERE id = ?";



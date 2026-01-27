use rusqlite::Connection;

fn main() {
    let db_path = "/home/entwickler/.local/share/com.dndnexus.app/dnd-nexus.db";
    let conn = Connection::open(db_path).expect("Could not open DB");
    
    println!("Refreshing Views...");

    // 1. Species
    conn.execute("DROP VIEW IF EXISTS all_species", []).unwrap();
    conn.execute(r#"
        CREATE VIEW all_species AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, 
               COALESCE(c.size, core.size) as size,
               COALESCE(c.speed, core.speed) as speed, 
               COALESCE(c.darkvision, core.darkvision) as darkvision, 
               json_object(
                 'traits', (SELECT json_group_array(json_object('name', name, 'description', description)) FROM species_traits WHERE species_id = core.id),
                 'languages', (SELECT json_group_array(language) FROM species_languages WHERE species_id = core.id)
               ) as data,
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_species core LEFT JOIN custom_species c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, size, speed, darkvision, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_species WHERE parent_id IS NULL;
    "#, []).unwrap();
    println!("- all_species refreshed");

    // 2. Feats
    conn.execute("DROP VIEW IF EXISTS all_feats", []).unwrap();
    conn.execute(r#"
        CREATE VIEW all_feats AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.category, core.category) as category, 
               COALESCE(c.description, core.description) as description,
               COALESCE(c.prerequisite, core.prerequisite) as prerequisite,
               '{}' as data,
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_feats core LEFT JOIN custom_feats c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, category, 
               json_extract(data, '$.description'), 
               json_extract(data, '$.prerequisite'),
               data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_feats WHERE parent_id IS NULL;
    "#, []).unwrap();
    println!("- all_feats refreshed");

    // 3. Backgrounds
    conn.execute("DROP VIEW IF EXISTS all_backgrounds", []).unwrap();
    conn.execute(r#"
        CREATE VIEW all_backgrounds AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name,
               COALESCE(c.description, core.description) as description,
               (SELECT json_group_array(ability) FROM background_ability_scores WHERE background_id = core.id) as ability_scores,
               (SELECT json_group_array(skill_name) FROM background_skills WHERE background_id = core.id) as skills,
               (SELECT json_group_array(json_object('type', type, 'name', name, 'category', category, 'description', description)) FROM background_tools WHERE background_id = core.id) as tools,
               (
                    SELECT json_group_array(
                        json_object(
                            'label', opt.label,
                            'gold', opt.gold,
                            'items', (SELECT json_group_array(json_object('name', item_name, 'quantity', quantity)) FROM background_equipment_items WHERE option_id = opt.id)
                        )
                    )
                    FROM background_equipment_options opt WHERE opt.background_id = core.id
               ) as starting_equipment,
               '{}' as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_backgrounds core LEFT JOIN custom_backgrounds c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, 
               json_extract(data, '$.description'),
               json_extract(data, '$.ability_scores'),
               json_extract(data, '$.skills'),
               CASE WHEN json_extract(data, '$.tool') IS NOT NULL THEN json_array(json_extract(data, '$.tool')) ELSE '[]' END,
               json_extract(data, '$.starting_equipment.options'),
               data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_backgrounds WHERE parent_id IS NULL;
    "#, []).unwrap();
    println!("- all_backgrounds refreshed");
}

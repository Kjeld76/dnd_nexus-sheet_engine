use rusqlite::Connection;
use std::path::PathBuf;

fn main() {
    println!("Refining Compendium Views with JSON Reconstruction...");

    // 1. Connect logic (copied from debug binaries)
    let home = std::env::var("HOME").unwrap();
    let db_path = PathBuf::from(home)
        .join(".local/share/com.dndnexus.app/dnd-nexus.db");

    let conn = Connection::open(&db_path).unwrap();

    // 2. Drop existing views
    conn.execute("DROP VIEW IF EXISTS all_species", []).unwrap();
    conn.execute("DROP VIEW IF EXISTS all_classes", []).unwrap();
    conn.execute("DROP VIEW IF EXISTS all_feats", []).unwrap();
    conn.execute("DROP VIEW IF EXISTS all_backgrounds", []).unwrap();

    // 3. Create all_species View (With JSON Construction)
    // Frontend expects: data.traits = [{name, description}]
    conn.execute(r#"
        CREATE VIEW all_species AS 
        SELECT 
            COALESCE(c.id, core.id) as id, 
            COALESCE(c.name, core.name) as name, 
            COALESCE(c.size, core.size) as size,
            COALESCE(c.speed, core.speed) as speed, 
            COALESCE(c.darkvision, core.darkvision) as darkvision, 
            COALESCE(c.data, json_object(
                 'traits', (
                     SELECT json_group_array(json_object('name', name, 'description', description)) 
                     FROM species_traits WHERE species_id = core.id
                 ),
                 'languages', (
                     SELECT json_group_array(language) 
                     FROM species_languages WHERE species_id = core.id
                 )
            )) as data,
            CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_species core 
        LEFT JOIN custom_species c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, size, speed, darkvision, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_species WHERE parent_id IS NULL
    "#, []).unwrap();
    println!("- all_species updated");

    // 4. Create all_classes View (With COMPLEX JSON Construction)
    // Frontend expects: data.subclasses = [{id, name, features: {"3": [...]}}], data.features_by_level = {"1": [...]}
    conn.execute(r#"
        CREATE VIEW all_classes AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.data, json_object(
                'hit_die', core.hit_die,
                'subclasses', (
                   SELECT json_group_array(
                     json_object(
                       'id', sub.id,
                       'name', sub.name,
                       'features', (
                          SELECT json_group_object(
                            cast(level as text),
                            json(feature_list)
                          )
                          FROM (
                            SELECT 
                              level, 
                              json_group_array(json_object('name', name, 'description', description)) as feature_list
                            FROM core_class_features
                            WHERE subclass_id = sub.id
                            GROUP BY level
                          )
                       )
                     )
                   )
                   FROM core_subclasses sub WHERE sub.class_id = core.id
                ),
                'features_by_level', (
                  SELECT json_group_object(
                    cast(level as text),
                    json(feature_list)
                  )
                  FROM (
                    SELECT 
                      level, 
                      json_group_array(json_object('name', name, 'description', description)) as feature_list
                    FROM core_class_features
                    WHERE class_id = core.id AND subclass_id IS NULL
                    GROUP BY level
                  )
                 ),
                'primary_abilities', (SELECT json_group_array(ability) FROM class_primary_abilities WHERE class_id = core.id),
                'saving_throws', (SELECT json_group_array(ability) FROM class_saving_throws WHERE class_id = core.id),
                'proficiencies', (SELECT json_group_array(value) FROM class_proficiencies WHERE class_id = core.id)
            )) as data,
            CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_classes core 
        LEFT JOIN custom_classes c ON c.parent_id = core.id
        UNION 
        SELECT id, name, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_classes WHERE parent_id IS NULL
    "#, []).unwrap();
    println!("- all_classes updated");

    // 5. Create all_feats and all_backgrounds (Standard COALESCE)
    conn.execute(r#"
        CREATE VIEW all_feats AS 
        SELECT 
            COALESCE(c.id, core.id) as id, 
            COALESCE(c.name, core.name) as name, 
            COALESCE(c.data, json_object(
                'description', core.description,
                'prerequisite', core.prerequisite
            )) as data,
            CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_feats core 
        LEFT JOIN custom_feats c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_feats WHERE parent_id IS NULL
    "#, []).unwrap();
    println!("- all_feats updated");
    
    // Backgrounds
    conn.execute(r#"
        CREATE VIEW all_backgrounds AS 
        SELECT 
             COALESCE(c.id, core.id) as id, 
             COALESCE(c.name, core.name) as name, 
             COALESCE(c.data, json_object(
                'description', core.description,
                'ability_scores', (SELECT json_group_array(ability) FROM background_ability_scores WHERE background_id = core.id),
                'skills', (SELECT json_group_array(skill_name) FROM background_skills WHERE background_id = core.id)
             )) as data, 
             CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_backgrounds core 
        LEFT JOIN custom_backgrounds c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_backgrounds WHERE parent_id IS NULL
    "#, []).unwrap();
    println!("- all_backgrounds updated");

    println!("Success: All Compendium Views Refined.");
}

use rusqlite::Connection;

fn main() {
    let db_path = "/home/entwickler/.local/share/com.dndnexus.app/dnd-nexus.db";
    let conn = Connection::open(db_path).expect("Could not open DB");

    println!("Hardening Database Views...");

    // 1. Ensure custom_species has all columns
    let _ = conn.execute("ALTER TABLE custom_species ADD COLUMN size TEXT", []);
    let _ = conn.execute("ALTER TABLE custom_species ADD COLUMN speed INTEGER", []);
    let _ = conn.execute("ALTER TABLE custom_species ADD COLUMN darkvision INTEGER", []);
    let _ = conn.execute("ALTER TABLE custom_species ADD COLUMN data TEXT", []);
    
    // 2. Ensure custom_classes has all columns
    let _ = conn.execute("ALTER TABLE custom_classes ADD COLUMN data TEXT", []);

    // 3. Drop existing views
    conn.execute("DROP VIEW IF EXISTS all_species", []).unwrap();
    conn.execute("DROP VIEW IF EXISTS all_classes", []).unwrap();
    conn.execute("DROP VIEW IF EXISTS all_feats", []).unwrap();
    conn.execute("DROP VIEW IF EXISTS all_backgrounds", []).unwrap();

    // 4. Hardened all_species View (Ensuring traits/languages are never NULL)
    conn.execute(r#"
        CREATE VIEW all_species AS 
        SELECT 
            COALESCE(c.id, core.id) as id, 
            COALESCE(c.name, core.name) as name, 
            COALESCE(c.size, core.size) as size,
            CAST(COALESCE(c.speed, core.speed) AS TEXT) as speed, 
            COALESCE(c.darkvision, core.darkvision) as darkvision, 
            COALESCE(c.data, json_object(
                 'traits', COALESCE((
                     SELECT json_group_array(json_object('name', name, 'description', description)) 
                     FROM species_traits WHERE species_id = core.id
                 ), '[]'),
                 'languages', COALESCE((
                     SELECT json_group_array(language) 
                     FROM species_languages WHERE species_id = core.id
                 ), '[]')
            )) as data,
            CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_species core 
        LEFT JOIN custom_species c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, size, CAST(speed AS TEXT), darkvision, COALESCE(data, '{}'), CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_species WHERE parent_id IS NULL
    "#, []).unwrap();

    // 5. Hardened all_classes View (Ensuring subclasses/features are never NULL)
    conn.execute(r#"
        CREATE VIEW all_classes AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.data, json_object(
                'hit_die', core.hit_die,
                'subclasses', COALESCE((
                   SELECT json_group_array(
                     json_object(
                       'id', sub.id,
                       'name', sub.name,
                       'description', sub.description,
                       'features', COALESCE((
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
                       ), '{}')
                     )
                   )
                   FROM core_subclasses sub WHERE sub.class_id = core.id
                ), '[]'),
                'features_by_level', COALESCE((
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
                 ), '{}'),
                'primary_abilities', COALESCE((SELECT json_group_array(ability) FROM class_primary_abilities WHERE class_id = core.id), '[]'),
                'saving_throws', COALESCE((SELECT json_group_array(ability) FROM class_saving_throws WHERE class_id = core.id), '[]'),
                'proficiencies', COALESCE((SELECT json_group_array(value) FROM class_proficiencies WHERE class_id = core.id), '[]')
            )) as data,
            CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_classes core 
        LEFT JOIN custom_classes c ON c.parent_id = core.id
        UNION 
        SELECT id, name, COALESCE(data, '{}'), CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_classes WHERE parent_id IS NULL
    "#, []).unwrap();

    // 6. Hardened all_feats View
    conn.execute(r#"
        CREATE VIEW all_feats AS 
        SELECT 
            COALESCE(c.id, core.id) as id, 
            COALESCE(c.name, core.name) as name, 
            COALESCE(c.category, core.category) as category,
            COALESCE(c.description, core.description) as description,
            COALESCE(c.prerequisite, core.prerequisite) as prerequisite,
            COALESCE(c.data, json_object(
                'description', core.description,
                'prerequisite', core.prerequisite
            )) as data,
            CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_feats core 
        LEFT JOIN custom_feats c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, category, description, prerequisite, COALESCE(data, '{}'), CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_feats WHERE parent_id IS NULL
    "#, []).unwrap();

    // 7. Hardened all_backgrounds View
    conn.execute(r#"
        CREATE VIEW all_backgrounds AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.description, core.description) as description,
            COALESCE(json(json_extract(COALESCE(c.data, core.data), '$.ability_scores')), '[]') as ability_scores,
            COALESCE(json(json_extract(COALESCE(c.data, core.data), '$.skills')), '[]') as skills,
            COALESCE(
                CASE 
                    WHEN json_type(COALESCE(c.data, core.data), '$.tool') = 'array' THEN json(json_extract(COALESCE(c.data, core.data), '$.tool'))
                    WHEN json_type(COALESCE(c.data, core.data), '$.tool') = 'object' THEN json_array(json(json_extract(COALESCE(c.data, core.data), '$.tool')))
                    ELSE '[]'
                END, '[]'
            ) as tools,
            COALESCE((
                SELECT json_group_array(json_object(
                    'label', json_extract(j1.value, '$.label'), 
                    'gold', json_extract(j1.value, '$.gold'), 
                    'items', (SELECT json_group_array(json_object('name', j2.value, 'quantity', 1)) FROM json_each(json_extract(j1.value, '$.items')) j2)
                )) FROM json_each(json_extract(COALESCE(c.data, core.data), '$.starting_equipment.options')) j1
            ), '[]') as starting_equipment,
            COALESCE(c.data, core.data) as data,
            CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_backgrounds core 
        LEFT JOIN custom_backgrounds c ON c.parent_id = core.id
        UNION 
        SELECT id, name, description, '[]', '[]', '[]', '[]', COALESCE(data, '{}'), CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_backgrounds WHERE parent_id IS NULL
    "#, []).unwrap();

    println!("Views Hardened successfully.");
}

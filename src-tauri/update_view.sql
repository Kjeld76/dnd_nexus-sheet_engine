        CREATE VIEW all_compendium_search AS
        -- Gear
        SELECT 
            'GEAR-' || id as id,
            id as raw_id,
            name,
            'gear' as item_category,
            CASE 
                WHEN source = 'core' THEN 'core_item'
                WHEN source = 'homebrew' THEN 'custom_item'
                ELSE 'custom_item'
            END as item_type,
            cost_gp,
            weight_kg,
            source,
            1 as priority
        FROM all_gear
        WHERE source = 'core'
        
        UNION
        
        -- Tools
        SELECT 
            'TOOL-' || id as id,
            id as raw_id,
            name,
            'tool' as item_category,
            CASE 
                WHEN source = 'core' THEN 'core_tool'
                WHEN source = 'homebrew' THEN 'custom_tool'
                ELSE 'custom_tool'
            END as item_type,
            cost_gp,
            weight_kg,
            source,
            1 as priority
        FROM all_tools
        WHERE source = 'core'
        
        UNION
        
        -- Items
        SELECT 
            'ITEM-' || id as id,
            id as raw_id,
            name,
            'item' as item_category,
            CASE 
                WHEN source = 'core' THEN 'core_item'
                WHEN source = 'homebrew' THEN 'custom_item'
                ELSE 'custom_item'
            END as item_type,
            cost_gp,
            weight_kg,
            source,
            1 as priority
        FROM all_items
        WHERE source = 'core'
        
        UNION
        
        -- Magic Items
        SELECT 
            'MAG-' || id as id,
            id as raw_id,
            name,
            'magic_item' as item_category,
            CASE 
                WHEN source = 'core' THEN 'core_magic_item'
                WHEN source = 'homebrew' THEN 'custom_magic_item'
                ELSE 'custom_magic_item'
            END as item_type,
            COALESCE(CAST(json_extract(data, '$.cost_gp') AS REAL), 0.0) as cost_gp,
            COALESCE(CAST(json_extract(data, '$.weight_kg') AS REAL), CAST(json_extract(data, '$.weight') AS REAL), 0.0) as weight_kg,
            source,
            1 as priority
        FROM all_mag_items_base
        WHERE source = 'core'
        
        UNION
        
        -- Homebrew/Custom Gear
        SELECT 
            'GEAR-' || id as id,
            id as raw_id,
            name,
            'gear' as item_category,
            'custom_item' as item_type,
            cost_gp,
            weight_kg,
            source,
            2 as priority
        FROM all_gear
        WHERE source IN ('homebrew', 'override')
        
        UNION
        
        -- Homebrew/Custom Tools
        SELECT 
            'TOOL-' || id as id,
            id as raw_id,
            name,
            'tool' as item_category,
            'custom_tool' as item_type,
            cost_gp,
            weight_kg,
            source,
            2 as priority
        FROM all_tools
        WHERE source IN ('homebrew', 'override')
        
        UNION
        
        -- Homebrew/Custom Items
        SELECT 
            'ITEM-' || id as id,
            id as raw_id,
            name,
            'item' as item_category,
            'custom_item' as item_type,
            cost_gp,
            weight_kg,
            source,
            2 as priority
        FROM all_items
        WHERE source IN ('homebrew', 'override')
        
        UNION
        
        -- Homebrew/Custom Magic Items
        SELECT 
            'MAG-' || id as id,
            id as raw_id,
            name,
            'magic_item' as item_category,
            'custom_magic_item' as item_type,
            COALESCE(CAST(json_extract(data, '$.cost_gp') AS REAL), 0.0) as cost_gp,
            COALESCE(CAST(json_extract(data, '$.weight_kg') AS REAL), CAST(json_extract(data, '$.weight') AS REAL), 0.0) as weight_kg,
            source,
            2 as priority
        FROM all_mag_items_base
        WHERE source IN ('homebrew', 'override')
        
        UNION
        
        -- Weapons
        SELECT 
            'WEAP-' || id as id,
            id as raw_id,
            name,
            'weapon' as item_category,
            CASE 
                WHEN source = 'core' THEN 'core_weapon'
                WHEN source = 'homebrew' THEN 'custom_weapon'
                ELSE 'custom_weapon'
            END as item_type,
            cost_gp,
            weight_kg,
            source,
            CASE WHEN source = 'core' THEN 1 ELSE 2 END as priority
        FROM all_weapons
        
        UNION
        
        -- Armor
        SELECT 
            'ARM-' || id as id,
            id as raw_id,
            name,
            'armor' as item_category,
            CASE 
                WHEN source = 'core' THEN 'core_armor'
                WHEN source = 'homebrew' THEN 'custom_armor'
                ELSE 'custom_armor'
            END as item_type,
            cost_gp,
            weight_kg,
            source,
            CASE WHEN source = 'core' THEN 1 ELSE 2 END as priority
        FROM all_armors;

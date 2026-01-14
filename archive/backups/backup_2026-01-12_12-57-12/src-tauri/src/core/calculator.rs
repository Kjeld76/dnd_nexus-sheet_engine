pub fn calculate_attribute_modifier(score: i32) -> i32 {
    (score - 10) / 2
}

pub fn calculate_proficiency_bonus(level: i32) -> i32 {
    match level {
        1..=4 => 2,
        5..=8 => 3,
        9..=12 => 4,
        13..=16 => 5,
        17..=20 => 6,
        _ => 2,
    }
}

pub fn calculate_skill_bonus(
    attr_mod: i32,
    prof_bonus: i32,
    is_proficient: bool,
    has_expertise: bool,
) -> i32 {
    let mut total = attr_mod;
    if has_expertise {
        total += prof_bonus * 2;
    } else if is_proficient {
        total += prof_bonus;
    }
    total
}

pub fn calculate_armor_class(
    base_ac: i32,
    dex_mod: i32,
    armor_type: &str, // "light", "medium", "heavy", "none"
    shield_bonus: i32,
) -> i32 {
    let dex_limit = match armor_type {
        "none" | "light" => dex_mod,
        "medium" => dex_mod.min(2),
        "heavy" => 0,
        _ => dex_mod,
    };
    base_ac + dex_limit + shield_bonus
}

pub fn calculate_encumbrance(str_score: i32) -> (i32, i32) {
    let capacity = str_score * 15;
    let push_drag_lift = capacity * 2;
    (capacity, push_drag_lift)
}













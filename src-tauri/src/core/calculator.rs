#![allow(dead_code)]
use crate::core::units::{STR_CAPACITY_FACTOR_KG, STR_MAX_LIFT_FACTOR_KG};

pub fn calculate_attribute_modifier(score: i32) -> i32 {
    (score - 10).div_euclid(2)
}

pub fn calculate_proficiency_bonus(level: i32) -> i32 {
    match level {
        1..=4 => 2,
        5..=8 => 3,
        9..=12 => 4,
        13..=16 => 5,
        17..=20 => 6,
        21..=24 => 7,
        25..=28 => 8,
        29..=30 => 9,
        // Fallback for > 30, though we treat 30 as current max logic
        _ => if level > 30 { 9 } else { 2 },
    }
}

pub fn calculate_spell_save_dc(prof_bonus: i32, attr_mod: i32) -> i32 {
    8 + prof_bonus + attr_mod
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

pub enum EncumbranceStatus {
    Normal,
    Encumbered, // Belastet
    HeavilyEncumbered, // Überladen
}

impl EncumbranceStatus {
    pub fn label(&self) -> &'static str {
        match self {
            EncumbranceStatus::Normal => "Normal",
            EncumbranceStatus::Encumbered => "Belastet",
            EncumbranceStatus::HeavilyEncumbered => "Überladen",
        }
    }
}

pub fn calculate_encumbrance(str_score: i32, current_weight_kg: f64) -> (f64, f64, EncumbranceStatus) {
    let capacity_kg = str_score as f64 * STR_CAPACITY_FACTOR_KG;
    let push_drag_lift_kg = str_score as f64 * STR_MAX_LIFT_FACTOR_KG;

    let status = if current_weight_kg > push_drag_lift_kg {
        EncumbranceStatus::HeavilyEncumbered
    } else if current_weight_kg > capacity_kg {
        EncumbranceStatus::Encumbered
    } else {
        EncumbranceStatus::Normal
    };

    (capacity_kg, push_drag_lift_kg, status)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_attribute_modifier_exhaustive() {
        // D&D 5e (2024): (Score - 10) / 2 rounded down.
        // Range 1 to 30
        let expected = [
            (1, -5), (2, -4), (3, -4), (4, -3), (5, -3),
            (6, -2), (7, -2), (8, -1), (9, -1), (10, 0),
            (11, 0), (12, 1), (13, 1), (14, 2), (15, 2),
            (16, 3), (17, 3), (18, 4), (19, 4), (20, 5),
            (21, 5), (22, 6), (23, 6), (24, 7), (25, 7),
            (26, 8), (27, 8), (28, 9), (29, 9), (30, 10),
        ];

        for (score, want) in expected {
            assert_eq!(
                calculate_attribute_modifier(score),
                want,
                "Modifier mismatch for score {}",
                score
            );
        }
    }

    #[test]
    fn test_calculate_proficiency_bonus_exhaustive() {
        // Range 1 to 30
        // 1-4: +2
        // 5-8: +3
        // 9-12: +4
        // 13-16: +5
        // 17-20: +6
        // 21-24: +7
        // 25-28: +8
        // 29-30: +9
        let expected = [
            (1, 2), (2, 2), (3, 2), (4, 2),
            (5, 3), (6, 3), (7, 3), (8, 3),
            (9, 4), (10, 4), (11, 4), (12, 4),
            (13, 5), (14, 5), (15, 5), (16, 5),
            (17, 6), (18, 6), (19, 6), (20, 6),
            (21, 7), (22, 7), (23, 7), (24, 7),
            (25, 8), (26, 8), (27, 8), (28, 8),
            (29, 9), (30, 9)
        ];

        for (level, want) in expected {
            assert_eq!(
                calculate_proficiency_bonus(level),
                want,
                "Proficiency Bonus mismatch for level {}",
                level
            );
        }
    }

    #[test]
    fn test_calculate_spell_save_dc() {
        // 8 + Prof + Mod
        // Test various combinations
        // Level 1 (Prof +2), Int 16 (+3) -> 13
        assert_eq!(calculate_spell_save_dc(2, 3), 13);
        // Level 5 (Prof +3), Wis 18 (+4) -> 15
        assert_eq!(calculate_spell_save_dc(3, 4), 15);
        // Level 17 (Prof +6), Cha 20 (+5) -> 19
        assert_eq!(calculate_spell_save_dc(6, 5), 19);
        // Negative Mod: Level 1 (Prof +2), Int 8 (-1) -> 9
        assert_eq!(calculate_spell_save_dc(2, -1), 9);
    }

    #[test]
    fn test_calculate_armor_class() {
        // Light: Base + Dex
        assert_eq!(calculate_armor_class(12, 3, "light", 0), 15);
        assert_eq!(calculate_armor_class(12, -1, "light", 0), 11);

        // Medium: Base + Dex (max 2)
        assert_eq!(calculate_armor_class(14, 1, "medium", 0), 15);
        assert_eq!(calculate_armor_class(14, 2, "medium", 0), 16);
        assert_eq!(calculate_armor_class(14, 3, "medium", 0), 16); // Cap applies
        assert_eq!(calculate_armor_class(14, -1, "medium", 0), 13); // Negative applies

        // Heavy: Base (no Dex)
        assert_eq!(calculate_armor_class(16, 3, "heavy", 0), 16);
        assert_eq!(calculate_armor_class(16, -1, "heavy", 0), 16);

        // Shield
        assert_eq!(calculate_armor_class(10, 0, "none", 2), 12);
        assert_eq!(calculate_armor_class(14, 2, "medium", 2), 18);
    }
    
    #[test]
    fn test_encumbrance_status_thresholds() {
        // Using correct constants verified in units.rs (7.5 and 15.0)
        let str_score = 10;
        let cap = 75.0; // 10 * 7.5
        let lift = 150.0; // 10 * 15.0

        let (c, l, status) = calculate_encumbrance(str_score, 75.0);
        assert_eq!(c, cap);
        assert_eq!(l, lift);
        assert!(matches!(status, EncumbranceStatus::Normal));

        let (_, _, status) = calculate_encumbrance(str_score, 75.1);
        assert!(matches!(status, EncumbranceStatus::Encumbered));

        let (_, _, status) = calculate_encumbrance(str_score, 150.0);
        assert!(matches!(status, EncumbranceStatus::Encumbered));

        let (_, _, status) = calculate_encumbrance(str_score, 150.1);
        assert!(matches!(status, EncumbranceStatus::HeavilyEncumbered));
    }

    #[test]
    fn test_encumbrance_scaling_1_to_30() {
        for str_score in 1..=30 {
            let cap_factor = 7.5;
            let lift_factor = 15.0;
            let (cap, lift, _) = calculate_encumbrance(str_score, 0.0);
            
            assert!((cap - (str_score as f64 * cap_factor)).abs() < 1e-10, "Capacity wrong for Str {}", str_score);
            assert!((lift - (str_score as f64 * lift_factor)).abs() < 1e-10, "Lift wrong for Str {}", str_score);
        }
    }
}

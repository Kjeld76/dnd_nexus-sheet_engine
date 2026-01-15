use crate::core::types::{Modifier, ModifierType};

#[allow(dead_code)]
pub fn apply_modifiers(base: i32, modifiers: &[Modifier]) -> i32 {
    let mut total = base;

    // 1. Overrides (höchster Wert gewinnt bei mehreren Overrides)
    let overrides: Vec<&Modifier> = modifiers
        .iter()
        .filter(|m| m.modifier_type == ModifierType::Override)
        .collect();

    if !overrides.is_empty() {
        total = overrides.iter().map(|m| m.value).max().unwrap_or(total);
    }

    // 2. Add
    for modifier in modifiers.iter().filter(|m| m.modifier_type == ModifierType::Add) {
        total += modifier.value;
    }

    // 3. Multiply
    for modifier in modifiers
        .iter()
        .filter(|m| m.modifier_type == ModifierType::Multiply)
    {
        total *= modifier.value;
    }

    total
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::types::ModifierType;

    #[test]
    fn test_apply_modifiers() {
        let modifiers = vec![
            Modifier {
                id: "1".into(),
                source: "Race".into(),
                target: "str".into(),
                modifier_type: ModifierType::Add,
                value: 2,
                condition: None,
            },
            Modifier {
                id: "2".into(),
                source: "Feat".into(),
                target: "str".into(),
                modifier_type: ModifierType::Override,
                value: 19,
                condition: None,
            },
        ];

        // Base 10, Override 19, Add 2 = 21
        assert_eq!(apply_modifiers(10, &modifiers), 21);
    }
}













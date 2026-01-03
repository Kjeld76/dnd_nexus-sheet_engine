pub fn convert_to_metric(value: f32, unit: &str) -> f32 {
    match unit {
        "ft" => value * 0.3,
        "lbs" => value * 0.4535,
        _ => value,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_conversions() {
        assert!((convert_to_metric(30.0, "ft") - 9.0).abs() < 0.001);
        assert!((convert_to_metric(10.0, "lbs") - 4.535).abs() < 0.001);
    }
}




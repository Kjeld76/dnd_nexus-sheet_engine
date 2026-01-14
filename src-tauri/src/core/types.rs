pub mod character {
    
}
pub mod spell {
    
}
pub mod compendium {
    
}
pub mod weapons {
    
}

// Backward compatibility re-exports
pub use crate::types::character::*;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum ModifierType {
    Override,
    Add,
    Multiply,
}

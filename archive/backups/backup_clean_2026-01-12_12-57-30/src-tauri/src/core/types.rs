pub mod character {
    pub use crate::types::character::*;
}
pub mod spell {
    pub use crate::types::spell::*;
}
pub mod compendium {
    pub use crate::types::compendium::*;
}
pub mod weapons {
    pub use crate::types::weapons::*;
}

// Backward compatibility re-exports
pub use crate::types::character::*;
pub use crate::types::spell::*;
pub use crate::types::compendium::*;
pub use crate::types::weapons::*;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum ModifierType {
    Override,
    Add,
    Multiply,
}

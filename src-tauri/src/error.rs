//! Error types for D&D Nexus application.
//!
//! This module provides structured error handling using `thiserror` for
//! better error messages and debugging.

use thiserror::Error;

/// Main error type for the application.
///
/// This enum represents all possible errors that can occur in the application,
/// from database errors to serialization errors.
#[derive(Debug, Error)]
#[allow(dead_code)]
pub enum AppError {

    /// Database-related errors
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    /// Serialization/Deserialization errors
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Lock acquisition errors (Mutex/Arc)
    #[error("Lock error: {0}")]
    Lock(String),

    /// Character not found
    #[error("Character with ID '{0}' not found")]
    CharacterNotFound(String),

    /// Invalid input data
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// File I/O errors
    #[error("File I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// Tauri-specific errors
    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    /// Generic error for cases that don't fit other categories
    #[error("Application error: {0}")]
    Other(String),
}

/// Type alias for Result with AppError
pub type AppResult<T> = Result<T, AppError>;

/// Helper trait to convert common error patterns to AppError
#[allow(dead_code)]
pub trait ToAppError<T> {
    fn to_app_error(self) -> AppResult<T>;
}

impl<T> ToAppError<T> for Result<T, std::sync::PoisonError<std::sync::MutexGuard<'_, rusqlite::Connection>>> {
    fn to_app_error(self) -> AppResult<T> {
        self.map_err(|e| AppError::Lock(format!("Mutex lock poisoned: {}", e)))
    }
}

/// Helper function to convert lock errors
pub fn map_lock_error<T, E: std::fmt::Display>(result: Result<T, E>) -> AppResult<T> {
    result.map_err(|e| AppError::Lock(e.to_string()))
}

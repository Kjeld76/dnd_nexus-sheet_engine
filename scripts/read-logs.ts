#!/usr/bin/env tsx
import { invoke } from '@tauri-apps/api/core';

async function readLogs() {
  try {
    const logs = await invoke<string>('read_logs');
    if (logs) {
      console.log('=== D&D Nexus Logs ===\n');
      console.log(logs);
    } else {
      console.log('No logs found. Make sure the app is running and has generated logs.');
    }
  } catch (err) {
    console.error('Error reading logs:', err);
  }
}

readLogs();

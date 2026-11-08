import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let projectId: string | undefined = undefined;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    projectId = parsed.projectId;
  }
} catch {
  // Ignora se não existir ou se formato for inválido
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId || process.env.FIREBASE_PROJECT_ID || 'ai-studio-remixrebeldiafmr',
  });
}

export const adminAuth = getAuth();

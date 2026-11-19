import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const isWindows = os.platform() === 'win32';

try {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('🗑️  Eliminando node_modules...');
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log('✅ node_modules eliminado');
  } else {
    console.log('ℹ️  No se encontró node_modules');
  }

  const lockFilePath = path.join(process.cwd(), 'bun.lock');
  if (fs.existsSync(lockFilePath)) {
    console.log('🗑️  Eliminando bun.lock...');
    fs.rmSync(lockFilePath, { force: true });
    console.log('✅ bun.lock eliminado');
  } else {
    console.log('ℹ️  No se encontró bun.lock');
  }

  console.log('📦 Instalando dependencias...');
  execSync('bun install', { stdio: 'inherit', shell: isWindows });

  console.log('✨ ¡Proceso completado con éxito!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

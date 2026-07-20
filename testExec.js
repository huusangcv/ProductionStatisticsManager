const { execSync } = require('child_process');
try {
  const out = execSync('powershell.exe -NoProfile -Command "Write-Output \\"A\\"\nWrite-Output \\"B\\""');
  console.log('out:', out.toString());
} catch(e) {
  console.log('err:', e.message);
}

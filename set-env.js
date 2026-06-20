const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Read private key and encode it as base64 to avoid CLI parsing issues
  const keyBuffer = fs.readFileSync('lib/private.key');
  const base64Key = keyBuffer.toString('base64');
  
  // No dashes or spaces in base64, so it won't be parsed as an option
  const cmd = `npx convex env set VONAGE_PRIVATE_KEY_BASE64 ${base64Key}`;
  
  console.log("Setting VONAGE_PRIVATE_KEY_BASE64...");
  execSync(cmd, { stdio: 'inherit' });
  console.log("Success!");
} catch (error) {
  console.error("Failed:", error);
}

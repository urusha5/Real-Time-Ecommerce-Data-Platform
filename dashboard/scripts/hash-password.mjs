import { hashPassword } from '../security.mjs';
let password = '';
if (process.stdin.isTTY) {
  process.stderr.write('Administrator password (14+ characters, input hidden): ');
  process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding('utf8');
  password = await new Promise(resolve => {
    process.stdin.on('data', function onData(text) {
      if (text.includes('\u0003')) process.exit(130);
      if (text.includes('\r') || text.includes('\n')) { process.stdin.off('data', onData); process.stdin.setRawMode(false); process.stdin.pause(); process.stderr.write('\n'); resolve(password); }
      else for (const char of text) { if (char === '\u007f' || char === '\b') password = password.slice(0, -1); else if (password.length < 257) password += char; }
    });
  });
} else {
  for await (const chunk of process.stdin) { password += chunk.toString('utf8'); if (password.length > 1024) throw new Error('Password input is too long.'); }
  password = password.replace(/\r?\n$/, '');
}
console.log(await hashPassword(password));

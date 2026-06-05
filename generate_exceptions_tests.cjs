const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src/domain/exceptions');
const destDir = path.join(process.cwd(), 'src/tests/domain/exceptions');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const classNames = [...content.matchAll(/export class (\w+)/g)].map(m => m[1]);
  
  if (classNames.length === 0) continue;

  let testContent = `import { describe, it, expect } from 'vitest';\nimport * as Exceptions from '../../../domain/exceptions/${file.replace('.ts', '')}';\n\ndescribe('${file.replace('.ts', '')}', () => {\n    it('should instantiate all exceptions correctly', () => {\n`;

  for (const cls of classNames) {
    if (cls === 'ParticipantNotRegisteredInTournamentException') {
        testContent += `        const ex${cls} = new Exceptions.${cls}(1);\n`;
    } else {
        testContent += `        const ex${cls} = new Exceptions.${cls}();\n`;
    }
    testContent += `        expect(ex${cls}).toBeInstanceOf(Error);\n`;
    testContent += `        expect(ex${cls}.name).toBe('${cls}');\n`;
  }
  
  testContent += `    });\n});\n`;
  
  fs.writeFileSync(path.join(destDir, file.replace('.ts', '.test.ts')), testContent);
  console.log('Created ' + file.replace('.ts', '.test.ts'));
}

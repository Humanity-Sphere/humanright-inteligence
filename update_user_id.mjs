import { readFileSync, writeFileSync } from 'fs';

const filePath = 'server/routes.ts';
const fileContent = readFileSync(filePath, 'utf8');

// Ersetze Kommentar und userId-Zuweisung mit dem neuen Code
const updatedContent = fileContent.replace(/\/\/ In a real app, would validate user is authenticated\s+const userId = req\.session\.userId \|\| 1;/g, 
                                          'const userId = req.session.userId as number;');

// Ersetze userId mit Kommentar zu Demo-Fallback
const finalContent = updatedContent.replace(/const userId = req\.session\.userId \|\| 1; \/\/ For demo: fall back to default user/g, 
                                          'const userId = req.session.userId as number;');

writeFileSync(filePath, finalContent);
console.log('All userId replacements completed');

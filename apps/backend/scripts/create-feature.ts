import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const toPascalCase = (str: string) => {
  return str
    .replace(/(^\w|-\w)/g, (match) => match.replace(/-/, '').toUpperCase());
};

const createFeature = (featureName: string) => {
  const baseDir = path.join(process.cwd(), 'src/features', featureName);
  const pascalName = toPascalCase(featureName);

  const structure = [
    'controllers',
    'interfaces',
    'repositories',
    'routes',
    'services',
    'middleware'
  ];

  if (fs.existsSync(baseDir)) {
    console.error(`Error: La feature "${featureName}" ya existe en ${baseDir}`);
    process.exit(1);
  }

  console.log(`Creando estructura para la feature: ${featureName}...`);

  structure.forEach(dir => {
    fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
  });

  // interfaces/types.ts
  fs.writeFileSync(
    path.join(baseDir, `interfaces/${featureName}.types.ts`),
    `export interface ${pascalName} {\n  id: string;\n  createdAt: Date;\n  updatedAt: Date;\n}\n`
  );
  fs.writeFileSync(path.join(baseDir, 'interfaces/index.ts'), `export * from './${featureName}.types';\n`);

  // repositories/repository.ts
  fs.writeFileSync(
    path.join(baseDir, `repositories/${featureName}.repository.ts`),
    `import { prisma } from '../../../prisma/prisma';\n\nexport class ${pascalName}Repository {\n  // Métodos del repositorio\n}\n`
  );
  fs.writeFileSync(path.join(baseDir, 'repositories/index.ts'), `export * from './${featureName}.repository';\n`);

  // services/service.ts
  fs.writeFileSync(
    path.join(baseDir, `services/${featureName}.service.ts`),
    `import { ${pascalName}Repository } from '../repositories';\n\nexport class ${pascalName}Service {\n  private readonly repository: ${pascalName}Repository;\n\n  constructor() {\n    this.repository = new ${pascalName}Repository();\n  }\n}\n`
  );
  fs.writeFileSync(path.join(baseDir, 'services/index.ts'), `export * from './${pascalName}.service';\n`);

  // controllers/controller.ts
  fs.writeFileSync(
    path.join(baseDir, `controllers/${featureName}.controller.ts`),
    `import { Request, Response } from 'express';\nimport { ${pascalName}Service } from '../services';\n\nexport class ${pascalName}Controller {\n  private readonly service: ${pascalName}Service;\n\n  constructor() {\n    this.service = new ${pascalName}Service();\n  }\n}\n`
  );
  fs.writeFileSync(path.join(baseDir, 'controllers/index.ts'), `export * from './${featureName}.controller';\n`);

  // routes/routes.ts
  fs.writeFileSync(
    path.join(baseDir, `routes/${featureName}.routes.ts`),
    `import { Router } from 'express';\nimport { ${pascalName}Controller } from '../controllers';\n\nconst router = Router();\nconst controller = new ${pascalName}Controller();\n\nexport default router;\n`
  );
  fs.writeFileSync(path.join(baseDir, 'routes/index.ts'), `export { default } from './${featureName}.routes';\n`);

  // middleware/index.ts
  fs.writeFileSync(path.join(baseDir, 'middleware/index.ts'), `// Exporta tus middlewares aquí\n`);

  console.log(`\n¡Feature "${featureName}" creada con éxito en ${baseDir}!`);
  console.log(`Recuerda registrar las rutas en src/app.ts o en el router principal.`);
  process.exit(0);
};

const featureNameArg = process.argv[2];

if (featureNameArg) {
  createFeature(featureNameArg);
} else {
  rl.question('Nombre de la nueva feature (ej: projects, billing): ', (answer) => {
    if (!answer) {
      console.error('El nombre de la feature es obligatorio.');
      process.exit(1);
    }
    createFeature(answer.trim().toLowerCase());
  });
}

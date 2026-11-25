import { readFileSync, readdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar el archivo principal
const mainYamlPath = resolve(__dirname, '../../docs/openapi.yaml');
const mainYamlFile = readFileSync(mainYamlPath, 'utf8');
let swaggerSpec = YAML.parse(mainYamlFile);

// Cargar y combinar los archivos de features
const featuresDir = resolve(__dirname, '../../docs/features');
const featureFiles = readdirSync(featuresDir).filter((f) => f.endsWith('.yaml'));

for (const file of featureFiles) {
  const featurePath = join(featuresDir, file);
  const featureContent = readFileSync(featurePath, 'utf8');
  const featureSpec = YAML.parse(featureContent);

  // Combinar paths
  if (featureSpec.paths) {
    swaggerSpec.paths = {
      ...swaggerSpec.paths,
      ...featureSpec.paths,
    };
  }

  // Combinar tags
  if (featureSpec.tags) {
    swaggerSpec.tags = [
      ...(swaggerSpec.tags || []),
      ...featureSpec.tags,
    ];
  }

  // Combinar components (schemas, securitySchemes, responses)
  if (featureSpec.components) {
    if (!swaggerSpec.components) {
      swaggerSpec.components = {};
    }

    // Schemas
    if (featureSpec.components.schemas) {
      swaggerSpec.components.schemas = {
        ...(swaggerSpec.components.schemas || {}),
        ...featureSpec.components.schemas,
      };
    }

    // Security Schemes
    if (featureSpec.components.securitySchemes) {
      swaggerSpec.components.securitySchemes = {
        ...(swaggerSpec.components.securitySchemes || {}),
        ...featureSpec.components.securitySchemes,
      };
    }

    // Responses
    if (featureSpec.components.responses) {
      swaggerSpec.components.responses = {
        ...(swaggerSpec.components.responses || {}),
        ...featureSpec.components.responses,
      };
    }
  }
}

export { swaggerSpec };

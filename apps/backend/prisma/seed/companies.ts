import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Empresas reales de Latinoamérica para usar con logo.dev
const realCompanies = [
  { name: 'Empresas Polar', domain: 'empresaspolar.com', country: 'VE', taxId: 'J-00123456', legalName: 'Empresas Polar C.A.' },
  { name: 'CANTV', domain: 'cantv.com.ve', country: 'VE', taxId: 'G-20000001', legalName: 'Compañía Anónima Nacional de Teléfonos de Venezuela' },
  { name: 'Movistar Venezuela', domain: 'movistar.com.ve', country: 'VE', taxId: 'J-30000012', legalName: 'Telefónica Móviles Venezuela C.A.' },
  { name: 'MercadoLibre', domain: 'mercadolibre.com', country: 'AR', taxId: '30-51234567-8', legalName: 'MercadoLibre Inc.' },
  { name: 'Grupo Bimbo', domain: 'grupobimbo.com', country: 'MX', taxId: 'BMO860515MV1', legalName: 'Grupo Bimbo S.A.B. de C.V.' },
  { name: 'Ecopetrol', domain: 'ecopetrol.com.co', country: 'CO', taxId: '900100123-1', legalName: 'Ecopetrol S.A.' },
  { name: 'Petrobras', domain: 'petrobras.com.br', country: 'BR', taxId: '33.000.123/0001-00', legalName: 'Petróleo Brasileiro S.A.' },
  { name: 'Grupo Nutresa', domain: 'gruponutresa.com', country: 'CO', taxId: '900123456-7', legalName: 'Grupo Nutresa S.A.' },
  { name: 'FEMSA', domain: 'femsa.com', country: 'MX', taxId: 'FEM900101QZ1', legalName: 'Fomento Económico Mexicano S.A.B. de C.V.' },
  { name: 'CEMEX', domain: 'cemex.com', country: 'MX', taxId: 'CEM8501015A1', legalName: 'CEMEX S.A.B. de C.V.' },
];

// Generar logo URL con logo.dev o fallback a ui-avatars
function getLogoUrl(companyName: string, domain?: string): string {
  const logoDevKey = process.env.LOGO_DEV_API_KEY;

  if (domain && logoDevKey) {
    // Usar logo.dev para empresas reales
    return `https://img.logo.dev/${domain}?token=${logoDevKey}&format=png&size=200`;
  }

  // Fallback: ui-avatars con iniciales
  const initials = companyName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=200&bold=true`;
}

// Generar datos de contacto según el país
function generateContactInfo(country: string, _companyName: string) {
  const countryData: Record<string, any> = {
    VE: {
      phonePrefix: '+58',
      states: ['Distrito Capital', 'Carabobo', 'Zulia', 'Lara', 'Mérida', 'Táchira', 'Aragua', 'Anzoátegui'],
      cities: ['Caracas', 'Valencia', 'Maracaibo', 'Barquisimeto', 'Mérida', 'San Cristóbal', 'Maracay', 'Puerto La Cruz'],
    },
    AR: {
      phonePrefix: '+54',
      states: ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza'],
      cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'],
    },
    MX: {
      phonePrefix: '+52',
      states: ['CDMX', 'Jalisco', 'Nuevo León', 'México'],
      cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Toluca'],
    },
    CO: {
      phonePrefix: '+57',
      states: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
      cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
    },
    BR: {
      phonePrefix: '+55',
      states: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'],
      cities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'],
    },
  };

  const data = countryData[country] || countryData.VE;
  const state = faker.helpers.arrayElement(data.states);
  const city = faker.helpers.arrayElement(data.cities);

  return {
    address: `${faker.location.streetAddress()}, ${city}, ${state}`,
    phone: `${data.phonePrefix}-${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`,
    email: `info@${faker.internet.domainName()}`.toLowerCase(),
  };
}

export async function seedCompanies(prisma: PrismaClient) {
  console.log('  Seeding companies...');

  // Verificar cuántas empresas existen
  const existingCount = await prisma.pmCompany.count();

  // Si ya hay 20, verificar si tienen logoUrl, si no, actualizar
  if (existingCount >= 20) {
    console.log('[Seed] Companies already exist, checking for missing logos...');
    const companiesWithoutLogo = await prisma.pmCompany.findMany({
      where: { logoUrl: null },
    });

    for (const company of companiesWithoutLogo) {
      await prisma.pmCompany.update({
        where: { id: company.id },
        data: { logoUrl: getLogoUrl(company.name) },
      });
    }

    if (companiesWithoutLogo.length > 0) {
      console.log(`[Seed] Updated ${companiesWithoutLogo.length} companies with missing logos.`);
    } else {
      console.log('[Seed] All companies have logos, skipping...');
    }

    return await prisma.pmCompany.findMany();
  }

  const companies = [];
  const needed = 20 - existingCount;

  // Determinar cuántas empresas reales vs falsas
  const realCompaniesCount = Math.min(realCompanies.length, Math.min(needed, 10));
  const fakerCompaniesCount = needed - realCompaniesCount;

  // 1. Agregar empresas reales (con logo.dev si hay API key, sino ui-avatars)
  for (let i = 0; i < realCompaniesCount; i++) {
    const company = realCompanies[i];
    if (!company) continue;
    const contact = generateContactInfo(company.country, company.name);

    companies.push({
      name: company.name,
      taxId: company.taxId,
      legalName: company.legalName,
      address: contact.address,
      phone: contact.phone,
      email: contact.email,
      logoUrl: getLogoUrl(company.name, company.domain),
      createdAt: faker.date.past({ years: 3 }),
      updatedAt: faker.date.recent({ days: 30 }),
    });
  }

  // 2. Agregar empresas generadas con faker-js (siempre con ui-avatars)
  for (let i = 0; i < fakerCompaniesCount; i++) {
    const companyName = faker.company.name();
    const contact = generateContactInfo('VE', companyName);

    companies.push({
      name: companyName,
      taxId: `J-${faker.string.numeric(8)}`,
      legalName: `${companyName} C.A.`,
      address: contact.address,
      phone: contact.phone,
      email: contact.email,
      logoUrl: getLogoUrl(companyName), // sin domain = ui-avatars
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
    });
  }

  if (companies.length > 0) {
    await prisma.pmCompany.createMany({
      data: companies,
    });
  }

  const allCompanies = await prisma.pmCompany.findMany();
  console.log('[Seed] Companies seeded:', allCompanies.length);

  return allCompanies;
}

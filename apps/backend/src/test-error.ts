import { FinancialService } from './features/financial-planning/services/financial.service';

async function main() {
  try {
    const service = new FinancialService();
    const res = await service.getByProjectId('c0aeab21-378e-4475-a15b-44e679fcad1c');
    console.log(res);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

main();

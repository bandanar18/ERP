import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalance, calcActualCost, calcTotalPayables, calcTotalDebt } from '../application/services/payables.calc.js';

test('deuda 10.000 con pago de 3.000 deja 7.000 pendientes (PARCIAL)', () => {
  const r = computeBalance(10000, [3000]);
  assert.equal(r.pending.toString(), '7000');
  assert.equal(r.paid.toString(), '3000');
  assert.equal(r.status, 'PARCIAL');
});

test('pago total => PAGADO y saldo 0', () => {
  const r = computeBalance(10000, [3000, 7000]);
  assert.equal(r.pending.toString(), '0');
  assert.equal(r.status, 'PAGADO');
});

test('sin pagos => PENDIENTE', () => {
  assert.equal(computeBalance(500, []).status, 'PENDIENTE');
});

test('Reglas de Aceptación: Costo Real y Cuentas por Pagar', () => {
  // Caso 1: Servicio consumido por $20.000, sin pagar
  // Costo real: $20.000 | Cuentas por pagar: $20.000
  const obl1 = {
    amountUsd: 20000,
    isIncurred: true,
    payments: []
  };
  assert.equal(calcActualCost([obl1], []), 20000);
  assert.equal(calcTotalPayables([obl1]), 20000);

  // Caso 2: Abono de $5.000 a ese servicio (genera gasto vinculado con obligationPaymentId)
  // Costo real: $20.000 (no duplica) | Cuentas por pagar: $15.000
  const obl2 = {
    amountUsd: 20000,
    isIncurred: true,
    payments: [{ amountUsd: 5000 }]
  };
  const expVinculado = {
    amountUsd: 5000,
    obligationPaymentId: 'pay-1'
  };
  assert.equal(calcActualCost([obl2], [expVinculado]), 20000);
  assert.equal(calcTotalPayables([obl2]), 15000);

  // Caso 3: Cancelación de los $15.000 restantes
  // Costo real: $20.000 | Cuentas por pagar: $0
  const obl3 = {
    amountUsd: 20000,
    isIncurred: true,
    payments: [{ amountUsd: 5000 }, { amountUsd: 15000 }]
  };
  const expVinculado2 = {
    amountUsd: 15000,
    obligationPaymentId: 'pay-2'
  };
  assert.equal(calcActualCost([obl3], [expVinculado, expVinculado2]), 20000);
  assert.equal(calcTotalPayables([obl3]), 0);

  // Caso 4: Gasto directo adicional por $3.000 (sin obligación previa)
  // Costo real: 20.000 + 3.000 = $23.000
  const expDirecto = {
    amountUsd: 3000,
    obligationPaymentId: null
  };
  assert.equal(calcActualCost([obl3], [expVinculado, expVinculado2, expDirecto]), 23000);

  // Caso 5: Compromiso futuro por $40.000 todavía no ejecutado (isIncurred: false)
  // Costo real: NO suma los $40.000 (permanece $23.000)
  // Deuda comprometida total: suma los $40.000 (20.000 + 40.000 = $60.000)
  const compromisoFuturo = {
    amountUsd: 40000,
    isIncurred: false,
    payments: []
  };
  assert.equal(calcActualCost([obl3, compromisoFuturo], [expVinculado, expVinculado2, expDirecto]), 23000);
  assert.equal(calcTotalDebt([obl3, compromisoFuturo]), 60000);
});

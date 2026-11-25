import { QcTrafficLight, QcTargetDirection } from '@prisma/client';

/**
 * Calcula el color del semáforo basado en el valor medido, la meta y la dirección.
 * Portado del `semaforo.service.ts` del origen (NestJS).
 */
export class SemaforoService {
  calculateTrafficLight(
    measured: number,
    target: number,
    direction: QcTargetDirection,
    thresholdsConfig?: any,
  ): QcTrafficLight {
    // Meta = 0 (accidentes, NC, etc.): comparación absoluta
    if (target === 0) {
      return measured <= 0 ? QcTrafficLight.GREEN : QcTrafficLight.RED;
    }

    const ratio = measured / target;

    const thresholds = thresholdsConfig ?? {
      green: 1.0,
      yellow: direction === QcTargetDirection.AT_LEAST ? 0.95 : 1.05,
    };

    if (direction === QcTargetDirection.AT_LEAST) {
      if (ratio >= (thresholds.green ?? 1.0)) return QcTrafficLight.GREEN;
      return QcTrafficLight.RED;
    }

    if (direction === QcTargetDirection.AT_MOST) {
      if (ratio <= (thresholds.green ?? 1.0)) return QcTrafficLight.GREEN;
      return QcTrafficLight.RED;
    }

    // EQUAL: coincidencia exacta (raro, soportado por compatibilidad)
    if ((direction as string) === 'EQUAL') {
      return measured === target ? QcTrafficLight.GREEN : QcTrafficLight.RED;
    }

    return QcTrafficLight.GRAY;
  }
}

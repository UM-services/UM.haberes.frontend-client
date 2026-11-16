import {
  Acreditacion,
  cierreLimite,
  estadoCarga,
  fechaLimitePayload,
  fechaLimiteVisible,
  mesAnterior,
  mesSiguiente,
  textoFecha,
  textoPeriodo,
} from './limite-novedades.models';

function registro(parcial: Partial<Acreditacion> = {}): Acreditacion {
  return {
    acreditacionId: 145,
    anho: 2026,
    mes: 11,
    acreditado: 0,
    limiteNovedades: null,
    fechaContable: null,
    ordenContable: null,
    sueldosOriginal: null,
    sueldosAjustados: null,
    contribucionesPatronales: null,
    ...parcial,
  };
}

describe('limite-novedades.models', () => {
  describe('fechaLimiteVisible', () => {
    it('muestra el día tal cual para un registro heredado a medianoche UTC', () => {
      expect(fechaLimiteVisible('2026-11-30T00:00:00Z')).toBe('2026-11-30');
      expect(fechaLimiteVisible('2026-11-30T00:00:00+0000')).toBe('2026-11-30');
    });

    it('convierte a día de Argentina un valor nuevo de fin de día', () => {
      expect(fechaLimiteVisible('2026-12-01T02:59:59Z')).toBe('2026-11-30');
    });

    it('devuelve vacío sin valor', () => {
      expect(fechaLimiteVisible(null)).toBe('');
      expect(fechaLimiteVisible(undefined)).toBe('');
    });
  });

  describe('fechaLimitePayload', () => {
    it('envía el fin del día elegido en hora de Argentina', () => {
      expect(fechaLimitePayload('2026-11-30')).toBe('2026-11-30T23:59:59-0300');
    });

    it('devuelve vacío sin fecha', () => {
      expect(fechaLimitePayload('')).toBe('');
    });
  });

  describe('cierreLimite', () => {
    it('calcula el instante de cierre del día elegido', () => {
      expect(cierreLimite('2026-11-30')?.toISOString()).toBe('2026-12-01T02:59:59.000Z');
      expect(cierreLimite('')).toBeNull();
    });
  });

  describe('estadoCarga', () => {
    const ahora = new Date('2026-11-15T12:00:00Z');

    it('acreditado manda sobre el límite', () => {
      expect(estadoCarga(registro({ acreditado: 1, limiteNovedades: '2099-01-01T00:00:00Z' }), ahora)).toBe(
        'acreditado',
      );
    });

    it('sin registro o sin límite queda sin límite definido', () => {
      expect(estadoCarga(null, ahora)).toBe('sin-limite');
      expect(estadoCarga(registro(), ahora)).toBe('sin-limite');
    });

    it('cerrada cuando el instante guardado ya pasó', () => {
      expect(estadoCarga(registro({ limiteNovedades: '2026-11-01T00:00:00Z' }), ahora)).toBe(
        'cerrada',
      );
    });

    it('abierta cuando el instante guardado todavía no llegó', () => {
      expect(estadoCarga(registro({ limiteNovedades: '2026-12-01T02:59:59Z' }), ahora)).toBe(
        'abierta',
      );
    });
  });

  describe('períodos', () => {
    it('retrocede con rollover de año', () => {
      expect(mesAnterior(2026, 1)).toEqual({ anho: 2025, mes: 12 });
      expect(mesAnterior(2026, 11)).toEqual({ anho: 2026, mes: 10 });
    });

    it('avanza con rollover de año', () => {
      expect(mesSiguiente(2026, 12)).toEqual({ anho: 2027, mes: 1 });
      expect(mesSiguiente(2026, 11)).toEqual({ anho: 2026, mes: 12 });
    });

    it('escribe el período con el nombre del mes', () => {
      expect(textoPeriodo(2026, 11)).toBe('Noviembre 2026');
    });

    it('formatea una fecha ISO corta como dd/mm/aaaa', () => {
      expect(textoFecha('2026-11-30')).toBe('30/11/2026');
      expect(textoFecha('')).toBe('');
    });
  });
});

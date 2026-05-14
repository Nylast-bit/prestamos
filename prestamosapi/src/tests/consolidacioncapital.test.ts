import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConsolidacionActivaId, getResumenConsolidacionActivaService } from '../services/consolidacioncapital.service';
import { supabase } from '../config/supabaseClient';

vi.mock('../config/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('consolidacioncapital.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConsolidacionActivaId', () => {
    it('deberia devolver la consolidacion si ya existe en la fecha', async () => {
      const mockConsolidacion = { IdConsolidacion: 123 };
      
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockConsolidacion });
      
      vi.mocked(supabase.from).mockImplementation((): any => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock,
      }));

      const result = await getConsolidacionActivaId('2024-03-01T00:00:00.000Z', 1);
      
      expect(result).toBe(123);
      expect(supabase.from).toHaveBeenCalledWith('ConsolidacionCapital');
    });

    it('deberia crear nueva consolidacion si no existe y arrastrar saldo', async () => {
        const maybeSingleMock = vi.fn()
          .mockResolvedValueOnce({ data: null }) // Primera llamada: no hay activa
          .mockResolvedValueOnce({ data: { CapitalEntrante: 1000, CapitalSaliente: 500 } }); // Segunda: la anterior

        const singleMock = vi.fn().mockResolvedValue({ data: { IdConsolidacion: 456 } });
        const insertMock = vi.fn().mockReturnThis();

        vi.mocked(supabase.from).mockImplementation((table: string): any => {
          if (table === 'ConsolidacionCapital') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              lte: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: maybeSingleMock,
              insert: insertMock,
              single: singleMock,
            };
          } else if (table === 'RegistroConsolidacion') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null })
            };
          } else if (table === 'GastoFijo') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: (cb: any) => cb({ data: [], error: null }) // simulando el await para gastos fijos
            }
          }
        });

        const result = await getConsolidacionActivaId('2024-03-01T00:00:00.000Z', 1);
        expect(result).toBe(456);
        expect(insertMock).toHaveBeenCalled();
    });
  });

  describe('getResumenConsolidacionActivaService', () => {
    it('deberia sumar correctamente ingresos y egresos', async () => {
        
        // Mock getConsolidacionActivaId
        const maybeSingleMock = vi.fn().mockResolvedValue({ data: { IdConsolidacion: 789 } });
      
        const singleMock = vi.fn().mockResolvedValue({ data: { FechaInicio: '2024-03-01', FechaFin: '2024-03-15' } });
        
        const eqMockRegistros = vi.fn().mockResolvedValue({ 
            data: [
                { Monto: 1000, TipoRegistro: 'Ingreso' },
                { Monto: 2000, TipoRegistro: 'ingreso ' },
                { Monto: 500, TipoRegistro: 'Egreso' }
            ],
            error: null
        });

        vi.mocked(supabase.from).mockImplementation((table: string): any => {
          if (table === 'ConsolidacionCapital') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              lte: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: maybeSingleMock,
              single: singleMock,
            };
          } else if (table === 'RegistroConsolidacion') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: eqMockRegistros
            }
          }
        });

        const result = await getResumenConsolidacionActivaService(1);
        expect(result.ingresosTotal).toBe(3000);
        expect(result.egresosTotal).toBe(500);
        expect(result.IdConsolidacion).toBe(789);
    });
  });
});

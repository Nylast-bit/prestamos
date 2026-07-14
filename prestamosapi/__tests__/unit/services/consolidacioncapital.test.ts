import { getConsolidacionActivaId, getResumenConsolidacionActivaService } from '../../../src/services/consolidacioncapital.service';
import { supabase } from '../../../src/config/supabaseClient';

jest.mock('../../../src/config/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
    })),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('consolidacioncapital.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConsolidacionActivaId', () => {
    it('deberia devolver la consolidacion si ya existe en la fecha', async () => {
      const mockConsolidacion = { IdConsolidacion: 123 };
      
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockConsolidacion });
      
      (supabase.from as jest.Mock).mockImplementation((): any => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock,
      }));

      const result = await getConsolidacionActivaId('2024-03-01T00:00:00.000Z', 1);
      
      expect(result).toBe(123);
      expect(supabase.from).toHaveBeenCalledWith('ConsolidacionCapital');
    });

    it('deberia crear nueva consolidacion si no existe y arrastrar saldo', async () => {
        const maybeSingleMock = jest.fn()
          .mockResolvedValueOnce({ data: null }) // Primera llamada: no hay activa
          .mockResolvedValueOnce({ data: { CapitalEntrante: 1000, CapitalSaliente: 500 } }); // Segunda: la anterior

        const singleMock = jest.fn().mockResolvedValue({ data: { IdConsolidacion: 456 } });
        const insertMock = jest.fn().mockReturnThis();

        (supabase.from as jest.Mock).mockImplementation((table: string): any => {
          if (table === 'ConsolidacionCapital') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              lte: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: maybeSingleMock,
              insert: insertMock,
              single: singleMock,
            };
          } else if (table === 'RegistroConsolidacion') {
            return {
              insert: jest.fn().mockResolvedValue({ error: null })
            };
          } else if (table === 'GastoFijo') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
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
        const maybeSingleMock = jest.fn().mockResolvedValue({ data: { IdConsolidacion: 789 } });
      
        const singleMock = jest.fn().mockResolvedValue({ data: { FechaInicio: '2024-03-01', FechaFin: '2024-03-15' } });
        
        const eqMockRegistros = jest.fn().mockResolvedValue({ 
            data: [
                { Monto: 1000, TipoRegistro: 'Ingreso' },
                { Monto: 2000, TipoRegistro: 'ingreso ' },
                { Monto: 500, TipoRegistro: 'Egreso' }
            ],
            error: null
        });

        (supabase.from as jest.Mock).mockImplementation((table: string): any => {
          if (table === 'ConsolidacionCapital') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              lte: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: maybeSingleMock,
              single: singleMock,
            };
          } else if (table === 'RegistroConsolidacion') {
            return {
              select: jest.fn().mockReturnThis(),
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

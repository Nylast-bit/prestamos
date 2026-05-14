import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAndCreateConsolidation } from '../services/capitaljob.service';
import { supabase } from '../config/supabaseClient';
import * as registroConsolidacionService from '../services/registroconsolidacion.service';
import * as gastoFijoJobService from '../services/gastofijojob.service';

vi.mock('../config/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
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

vi.mock('../services/registroconsolidacion.service', () => ({
    createRegistroConsolidacionService: vi.fn().mockResolvedValue({})
}));

vi.mock('../services/gastofijojob.service', () => ({
    processFixedExpenses: vi.fn().mockResolvedValue({})
}));

describe('capitaljob.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAndCreateConsolidation', () => {
    it('deberia devolver la consolidacion si ya existe', async () => {
      const mockConsolidacion = { IdConsolidacion: 123, IdEmpresa: 1 };
      
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockConsolidacion });
      
      vi.mocked(supabase.from).mockImplementation((): any => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock,
      }));

      const result = await checkAndCreateConsolidation(1);
      
      expect(result).toEqual(mockConsolidacion);
      expect(supabase.from).toHaveBeenCalledWith('ConsolidacionCapital');
    });

    it('deberia crear nueva consolidacion si no existe y registrar balance anterior', async () => {
        const maybeSingleMock = vi.fn()
          .mockResolvedValueOnce({ data: null }) // no existe actual
          .mockResolvedValueOnce({ data: { CapitalEntrante: 2000, CapitalSaliente: 1000 } }); // existe anterior

        const singleMock = vi.fn().mockResolvedValue({ data: { IdConsolidacion: 456 } });
        const insertMock = vi.fn().mockReturnThis();

        vi.mocked(supabase.from).mockImplementation((table: string): any => {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: maybeSingleMock,
              insert: insertMock,
              single: singleMock,
            };
        });

        const result = await checkAndCreateConsolidation(1);
        
        expect(result).toEqual({ IdConsolidacion: 456 });
        expect(insertMock).toHaveBeenCalled();
        expect(registroConsolidacionService.createRegistroConsolidacionService).toHaveBeenCalledWith(
            expect.objectContaining({
                IdConsolidacion: 456,
                TipoRegistro: "Ingreso",
                Monto: 1000
            }),
            1
        );
        expect(gastoFijoJobService.processFixedExpenses).toHaveBeenCalledWith(456, 1);
    });

    it('deberia manejar balance deficitario anterior', async () => {
        const maybeSingleMock = vi.fn()
          .mockResolvedValueOnce({ data: null }) // no existe actual
          .mockResolvedValueOnce({ data: { CapitalEntrante: 1000, CapitalSaliente: 2000 } }); // existe anterior con deficit

        const singleMock = vi.fn().mockResolvedValue({ data: { IdConsolidacion: 456 } });
        const insertMock = vi.fn().mockReturnThis();

        vi.mocked(supabase.from).mockImplementation((table: string): any => {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: maybeSingleMock,
              insert: insertMock,
              single: singleMock,
            };
        });

        const result = await checkAndCreateConsolidation(1);
        
        expect(result).toEqual({ IdConsolidacion: 456 });
        expect(registroConsolidacionService.createRegistroConsolidacionService).toHaveBeenCalledWith(
            expect.objectContaining({
                IdConsolidacion: 456,
                TipoRegistro: "Egreso",
                Monto: 1000
            }),
            1
        );
    });
  });
});

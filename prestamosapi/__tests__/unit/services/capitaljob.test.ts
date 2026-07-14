import { checkAndCreateConsolidation } from '../../../src/services/capitaljob.service';
import { supabase } from '../../../src/config/supabaseClient';
import * as registroConsolidacionService from '../../../src/services/registroconsolidacion.service';
import * as gastoFijoJobService from '../../../src/services/gastofijojob.service';

jest.mock('../../../src/config/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
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

jest.mock('../../../src/services/registroconsolidacion.service', () => ({
    createRegistroConsolidacionService: jest.fn().mockResolvedValue({})
}));

jest.mock('../../../src/services/gastofijojob.service', () => ({
    processFixedExpenses: jest.fn().mockResolvedValue({})
}));

describe('capitaljob.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndCreateConsolidation', () => {
    it('deberia devolver la consolidacion si ya existe', async () => {
      const mockConsolidacion = { IdConsolidacion: 123, IdEmpresa: 1 };
      
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockConsolidacion });
      
      (supabase.from as jest.Mock).mockImplementation((): any => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock,
      }));

      const result = await checkAndCreateConsolidation(1);
      
      expect(result).toEqual(mockConsolidacion);
      expect(supabase.from).toHaveBeenCalledWith('ConsolidacionCapital');
    });

    it('deberia crear nueva consolidacion si no existe y registrar balance anterior', async () => {
        const maybeSingleMock = jest.fn()
          .mockResolvedValueOnce({ data: null }) // no existe actual
          .mockResolvedValueOnce({ data: { CapitalEntrante: 2000, CapitalSaliente: 1000 } }); // existe anterior

        const singleMock = jest.fn().mockResolvedValue({ data: { IdConsolidacion: 456 } });
        const insertMock = jest.fn().mockReturnThis();

        (supabase.from as jest.Mock).mockImplementation((table: string): any => {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
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
        const maybeSingleMock = jest.fn()
          .mockResolvedValueOnce({ data: null }) // no existe actual
          .mockResolvedValueOnce({ data: { CapitalEntrante: 1000, CapitalSaliente: 2000 } }); // existe anterior con deficit

        const singleMock = jest.fn().mockResolvedValue({ data: { IdConsolidacion: 456 } });
        const insertMock = jest.fn().mockReturnThis();

        (supabase.from as jest.Mock).mockImplementation((table: string): any => {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
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

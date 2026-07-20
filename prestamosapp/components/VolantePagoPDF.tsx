import React, { forwardRef } from 'react';

// 1. Ampliamos la interfaz con todos los campos que pediste
export interface PagoData {
  IdPago: number;
  FechaPago: string; // Efectividad
  MontoPagado: number; // Pago total
  Cliente: string;
  IdPrestamo: number;
  NumeroCuota: number; // Cuota Nro
  Observaciones: string;
  TipoPago: string;
  
  // Nuevos campos detallados
  PagoCapital: number;
  PagoInteres: number;
  PagoAbono: number; // Abono extra a capital (si aplica)
  PagoMora: number;
  
  // Datos del préstamo
  InicioPrestamo: string; // Inicio
  TerminoPrestamo: string; // Termino
  MontoPendiente: number; // Monto pend
  CuotasTotales: number; // Cuota(s) Total
}

export const VolantePago = forwardRef<HTMLDivElement, { data: PagoData | null }>((props, ref) => {
  const { data } = props;

  if (!data) return null;

  // Función para convertir número a letras (Mantenida intacta)
  const numeroALetras = (num: number): string => {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    
    if (num === 0) return 'CERO';
    
    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    
    let resultado = '';
    
    if (miles > 0) {
      if (miles === 1) {
        resultado = 'MIL';
      } else {
        resultado = unidades[miles] + ' MIL';
      }
    }
    
    if (resto > 0) {
      if (resultado) resultado += ' ';
      const cent = Math.floor(resto / 100);
      const dec = Math.floor((resto % 100) / 10);
      const uni = resto % 10;
      
      if (cent > 0) {
        resultado += (resto === 100 ? 'CIEN' : centenas[cent]);
      }
      if (dec > 0 || uni > 0) {
        if (cent > 0) resultado += ' ';
        if (dec === 1) {
          const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
          resultado += especiales[uni];
        } else {
          if (dec > 0) resultado += decenas[dec];
          if (dec > 0 && uni > 0) resultado += ' Y ';
          if (uni > 0) resultado += unidades[uni];
        }
      }
    }
    
    return resultado || 'CERO';
  };

  const montoEnLetras = numeroALetras(Math.floor(data.MontoPagado));

  // Helper para moneda local
  const formatoMoneda = (monto: number) => 
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(monto);

  const formatoFecha = (fecha: string) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString('es-DO', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  return (
    <div 
      ref={ref} 
      style={{
        padding: '60px',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1e293b',
        position: 'relative',
        minHeight: '1050px'
      }}
    >
      {/* Marca de agua */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: '120px',
        fontWeight: 900,
        color: 'rgba(33, 54, 133, 0.03)',
        zIndex: 0,
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        PAGADO
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Encabezado */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '40px',
          borderBottom: '3px solid #213685',
          paddingBottom: '24px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 900, 
              color: '#213685',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              CREDIT WAY S.R.L
            </h1>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', lineHeight: '1.8' }}>
              <p style={{ margin: 0 }}>Santo Domingo Oeste, República Dominicana</p>
              <p style={{ margin: 0 }}>Tel: (809) 555-5555 | info@creditway.com</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{
              backgroundColor: '#f1f5f9',
              padding: '16px 24px',
              borderRadius: '8px',
              border: '2px solid #213685'
            }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', margin: '0 0 8px 0', letterSpacing: '2px' }}>
                RECIBO DE PAGO
              </h2>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#213685', margin: 0, fontFamily: 'monospace' }}>
                #{data.IdPago.toString().padStart(6, '0')}
              </p>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#475569', margin: '12px 0 0 0' }}>
              <strong>Efectividad:</strong> {new Date(data.FechaPago).toLocaleString('es-DO', { 
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Bloque: Información del Cliente y Préstamo */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
          
          {/* Columna Izquierda: Cliente */}
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', margin: '0 0 8px 0', letterSpacing: '1px' }}>RECIBIDO DE</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0', borderLeft: '4px solid #213685', paddingLeft: '12px' }}>
              {data.Cliente}
            </p>
            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 4px 0' }}><strong>Préstamo ID:</strong> PR-{data.IdPrestamo}</p>
            <p style={{ fontSize: '13px', color: '#475569', margin: '0' }}><strong>Cuota Nro:</strong> {data.NumeroCuota === 0 ? "Abono Extraordinario" : data.NumeroCuota}</p>
          </div>

          {/* Columna Derecha: Estado del Préstamo */}
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', margin: '0 0 12px 0', letterSpacing: '1px' }}>ESTADO DEL PRÉSTAMO</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <p style={{ color: '#64748b', margin: '0 0 2px 0' }}>Inicio:</p>
                <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatoFecha(data.InicioPrestamo)}</p>
              </div>
              <div>
                <p style={{ color: '#64748b', margin: '0 0 2px 0' }}>Término:</p>
                <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatoFecha(data.TerminoPrestamo)}</p>
              </div>
              <div>
                <p style={{ color: '#64748b', margin: '0 0 2px 0' }}>Cuota(s) Total:</p>
                <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>{data.CuotasTotales}</p>
              </div>
              <div>
                <p style={{ color: '#64748b', margin: '0 0 2px 0' }}>Monto Pendiente:</p>
                <p style={{ fontWeight: 600, color: '#b91c1c', margin: 0 }}>{formatoMoneda(data.MontoPendiente)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles de la Transacción (Tabla de Desglose) */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', margin: '0 0 16px 0', letterSpacing: '1.5px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            DESGLOSE DEL PAGO
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '14px' }}>Pago Capital</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{formatoMoneda(data.PagoCapital)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '14px' }}>Pago Interés</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{formatoMoneda(data.PagoInteres)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '14px' }}>Pago Abono (Extraordinario)</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{formatoMoneda(data.PagoAbono)}</td>
              </tr>
              <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '14px' }}>Pago Mora</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{formatoMoneda(data.PagoMora)}</td>
              </tr>
              <tr style={{ backgroundColor: '#eff6ff' }}>
                <td style={{ padding: '16px', color: '#1e40af', fontSize: '16px', fontWeight: 800 }}>PAGO TOTAL</td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, color: '#1d4ed8', fontSize: '20px' }}>
                  {formatoMoneda(data.MontoPagado)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Letras y Observaciones */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', fontWeight: 600, margin: 0 }}>
              SON: {montoEnLetras} PESOS DOMINICANOS 00/100
            </p>
            {data.Observaciones && (
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '40%', textAlign: 'right' }}>
                <strong>Nota:</strong> {data.Observaciones}
              </p>
            )}
          </div>
        </div>

        {/* Firmas y Footer (Mantenidos igual de hermosos) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', marginBottom: '48px' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              borderTop: '2px solid #1e293b',
              paddingTop: '8px',
              marginTop: '60px'
            }}>
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#1e293b',
                margin: 0,
                textAlign: 'center'
              }}>
                Firma Autorizada
              </p>
              <p style={{
                fontSize: '10px',
                color: '#64748b',
                margin: '4px 0 0 0',
                textAlign: 'center'
              }}>
                Credit Way S.R.L
              </p>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px', marginTop: '60px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', margin: 0, textAlign: 'center' }}>Firma del Cliente</p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0', textAlign: 'center' }}>{data.Cliente}</p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
            <div>
              <p style={{ margin: '0 0 4px 0' }}><strong>Emitido por:</strong> Sistema Web</p>
              <p style={{ margin: 0 }}><strong>Impreso:</strong> {new Date().toLocaleString('es-DO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700, color: '#213685', margin: '0 0 4px 0', fontSize: '11px' }}>¡Gracias por su preferencia!</p>
              <p style={{ margin: 0 }}>www.creditway.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VolantePago.displayName = "VolantePago";
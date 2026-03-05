import React, { forwardRef } from 'react';

interface PagoData {
  IdPago: number;
  FechaPago: string;
  MontoPagado: number;
  Cliente: string;
  IdPrestamo: number;
  NumeroCuota: number;
  Observaciones: string;
  TipoPago: string;
}

export const VolantePago = forwardRef<HTMLDivElement, { data: PagoData | null }>((props, ref) => {
  const { data } = props;

  if (!data) return null;

  // Función para convertir número a letras (básica)
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
          marginBottom: '48px',
          borderBottom: '3px solid #213685',
          paddingBottom: '32px'
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
            <div style={{ 
              marginTop: '12px', 
              fontSize: '13px', 
              color: '#64748b',
              lineHeight: '1.8'
            }}>
              <p style={{ margin: 0 }}>RNC: 1-23-45678-9</p>
              <p style={{ margin: 0 }}>Av. Principal #123, Santo Domingo, República Dominicana</p>
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
              <h2 style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#64748b',
                margin: '0 0 8px 0',
                letterSpacing: '2px'
              }}>
                RECIBO DE PAGO
              </h2>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 900, 
                color: '#213685',
                margin: 0,
                fontFamily: 'monospace'
              }}>
                #{data.IdPago.toString().padStart(6, '0')}
              </p>
            </div>
            <p style={{ 
              fontSize: '13px', 
              fontWeight: 500, 
              color: '#475569',
              margin: '12px 0 0 0'
            }}>
              {new Date(data.FechaPago).toLocaleDateString('es-DO', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Información del Cliente */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: '#64748b',
              margin: '0 0 8px 0',
              letterSpacing: '1px'
            }}>
              RECIBIDO DE
            </p>
            <p style={{ 
              fontSize: '22px', 
              fontWeight: 700, 
              color: '#1e293b',
              margin: 0,
              borderLeft: '4px solid #213685',
              paddingLeft: '16px'
            }}>
              {data.Cliente}
            </p>
          </div>
        </div>

        {/* Monto Principal */}
        <div style={{ 
          backgroundColor: '#dbeafe',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '14px', 
            fontWeight: 700, 
            color: '#1e40af',
            margin: '0 0 8px 0',
            letterSpacing: '2px'
          }}>
            MONTO TOTAL PAGADO
          </p>
          <p style={{ 
            fontSize: '48px', 
            fontWeight: 900, 
            color: '#213685',
            margin: 0,
            lineHeight: 1
          }}>
            {new Intl.NumberFormat('es-DO', { 
              style: 'currency', 
              currency: 'DOP' 
            }).format(data.MontoPagado)}
          </p>
          <p style={{
            fontSize: '12px',
            color: '#475569',
            fontStyle: 'italic',
            margin: '12px 0 0 0',
            fontWeight: 600
          }}>
            SON: {montoEnLetras} PESOS DOMINICANOS 00/100
          </p>
        </div>

        {/* Detalles de la Transacción */}
        <div style={{ marginBottom: '48px' }}>
          <h3 style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            color: '#64748b',
            margin: '0 0 16px 0',
            letterSpacing: '1.5px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '8px'
          }}>
            DETALLES DE LA TRANSACCIÓN
          </h3>
          
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            border: '1px solid #e2e8f0'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '1px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  CONCEPTO
                </th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '1px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  REFERENCIA
                </th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'right',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '1px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  IMPORTE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ 
                  padding: '20px 16px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <p style={{ 
                    fontWeight: 700, 
                    color: '#1e293b',
                    margin: '0 0 6px 0',
                    fontSize: '15px'
                  }}>
                    Pago de Cuota #{data.NumeroCuota}
                  </p>
                  <p style={{ 
                    color: '#64748b',
                    fontSize: '12px',
                    margin: '0 0 4px 0'
                  }}>
                    Método de pago: {data.TipoPago}
                  </p>
                  {data.Observaciones && (
                    <p style={{ 
                      color: '#94a3b8',
                      fontSize: '11px',
                      fontStyle: 'italic',
                      margin: 0
                    }}>
                      "{data.Observaciones}"
                    </p>
                  )}
                </td>
                <td style={{ 
                  padding: '20px 16px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    PR-{data.IdPrestamo}
                  </span>
                </td>
                <td style={{ 
                  padding: '20px 16px',
                  textAlign: 'right',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1e293b'
                  }}>
                    {new Intl.NumberFormat('es-DO', { 
                      style: 'currency', 
                      currency: 'DOP' 
                    }).format(data.MontoPagado)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Información Adicional */}
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '40px'
        }}>
          <p style={{
            fontSize: '11px',
            color: '#92400e',
            margin: 0,
            lineHeight: '1.6'
          }}>
            <strong>Nota importante:</strong> Este documento constituye un comprobante oficial de pago. 
            Conserve este recibo para futuras referencias. En caso de discrepancia, favor contactar 
            nuestro departamento de servicio al cliente dentro de los próximos 30 días.
          </p>
        </div>

        {/* Firmas */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: '40px',
          marginBottom: '48px'
        }}>
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
                Firma del Cliente
              </p>
              <p style={{
                fontSize: '10px',
                color: '#64748b',
                margin: '4px 0 0 0',
                textAlign: 'center'
              }}>
                {data.Cliente}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '2px dashed #cbd5e1',
          paddingTop: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#94a3b8'
          }}>
            <div>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong>Emitido por:</strong> Sistema Web
              </p>
              <p style={{ margin: 0 }}>
                <strong>Fecha de emisión:</strong> {new Date().toLocaleString('es-DO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ 
                fontWeight: 700, 
                color: '#213685',
                margin: '0 0 4px 0',
                fontSize: '11px'
              }}>
                ¡Gracias por su preferencia!
              </p>
              <p style={{ margin: 0 }}>
                www.creditway.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VolantePago.displayName = "VolantePago";
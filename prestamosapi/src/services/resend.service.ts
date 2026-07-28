import { Resend } from 'resend';
import { logger } from '../utils/logger';

const resendApiKey = process.env.RESEND_API_KEY 
const resendFromEmail = process.env.RESEND_FROM_EMAIL 

const resend = new Resend(resendApiKey);

export const sendOtpEmail = async (email: string, code: string): Promise<boolean> => {
    try {
        const { data, error } = await resend.emails.send({
            from: `Sistema de Préstamos <${resendFromEmail}>`,
            to: [email],
            subject: 'Código de Verificación OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #213685; margin: 0;">Sistema de Préstamos</h2>
                        <p style="color: #666; font-size: 14px; margin-top: 5px;">Verificación de Seguridad</p>
                    </div>
                    <div style="background-color: #f4f6fc; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                        <p style="font-size: 14px; color: #333; margin-bottom: 10px;">Tu código de verificación es:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #213685; margin: 15px 0;">${code}</div>
                        <p style="font-size: 12px; color: #888; margin: 0;">Este código vence en 10 minutos.</p>
                    </div>
                    <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Si no solicitaste este código, por favor ignora este correo.</p>
                </div>
            `
        });

        if (error) {
            logger.error(`Error enviando email OTP con Resend: ${error.message}`);
            return false;
        }

        logger.info(`✅ Email OTP enviado exitosamente a ${email} (ID: ${data?.id})`);
        return true;
    } catch (err: any) {
        logger.error(`Error en sendOtpEmail: ${err.message}`);
        return false;
    }
};

package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.model.Reserva;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Properties;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final ConfigPagoService configPagoService;

    /**
     * Crea un JavaMailSender dinámico con las credenciales guardadas en la BD.
     */
    private JavaMailSender createMailSender(String email, String password) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("smtp.gmail.com");
        sender.setPort(587);
        sender.setUsername(email);
        sender.setPassword(password);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");

        return sender;
    }

    @Async
    public void enviarCodigoRecuperacion(String to, String codigo, String titular) {
        try {
            ConfigPago config = configPagoService.getConfig();

            if (config.getEmailRemitente() == null || config.getEmailPassword() == null) {
                log.warn("Email no configurado — no se envio codigo de recuperacion a {}", to);
                return;
            }

            JavaMailSender mailSender = createMailSender(config.getEmailRemitente(), config.getEmailPassword());

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
                    <h2 style="color: #ccff00; margin-top: 0;">Recuperar contrasena</h2>
                    <p>Recibimos una solicitud para restablecer tu contrasena.</p>
                    <p>Tu codigo de verificacion es:</p>
                    <div style="background: #161618; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ccff00;">%s</span>
                    </div>
                    <p style="color: #a1a1aa; font-size: 13px;">Este codigo expira en 15 minutos. Si no solicitaste esto, ignora este email.</p>
                    <p style="margin-top: 24px; color: #a1a1aa; font-size: 12px;">— %s</p>
                </div>
                """.formatted(codigo, titular);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(config.getEmailRemitente());
            helper.setTo(to);
            helper.setSubject("Codigo de recuperacion - " + titular);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Codigo de recuperacion enviado a {}", to);

        } catch (MessagingException e) {
            log.error("Error al enviar codigo de recuperacion a {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void enviarCodigoVerificacion(String to, String codigo, String titular) {
        try {
            ConfigPago config = configPagoService.getConfig();

            if (config.getEmailRemitente() == null || config.getEmailPassword() == null) {
                log.warn("Email no configurado — no se envio codigo de verificacion a {}", to);
                return;
            }

            JavaMailSender mailSender = createMailSender(config.getEmailRemitente(), config.getEmailPassword());

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
                    <h2 style="color: #ccff00; margin-top: 0;">Verifica tu email</h2>
                    <p>Bienvenido a %s! Para activar tu cuenta, ingresa este codigo:</p>
                    <div style="background: #161618; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ccff00;">%s</span>
                    </div>
                    <p style="color: #a1a1aa; font-size: 13px;">Este codigo expira en 30 minutos. Si no creaste una cuenta, ignora este email.</p>
                    <p style="margin-top: 24px; color: #a1a1aa; font-size: 12px;">— %s</p>
                </div>
                """.formatted(titular, codigo, titular);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(config.getEmailRemitente());
            helper.setTo(to);
            helper.setSubject("Verifica tu email - " + titular);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Codigo de verificacion enviado a {}", to);

        } catch (MessagingException e) {
            log.error("Error al enviar codigo de verificacion a {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void enviarConfirmacion(Reserva reserva) {
        try {
            ConfigPago config = configPagoService.getConfig();

            if (config.getEmailRemitente() == null || config.getEmailPassword() == null) {
                log.warn("Email no configurado — no se envio notificacion para reserva #{}", reserva.getId());
                return;
            }

            JavaMailSender mailSender = createMailSender(config.getEmailRemitente(), config.getEmailPassword());

            String to = reserva.getUsuario().getEmail();
            String nombre = reserva.getUsuario().getNombre();
            String cancha = reserva.getCancha().getNombre();
            String fecha = reserva.getFecha().toString();
            String horario = reserva.getHoraInicio() + " - " + reserva.getHoraFin();

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
                    <h2 style="color: #ccff00; margin-top: 0;">Reserva confirmada</h2>
                    <p>Hola <strong>%s</strong>,</p>
                    <p>Tu reserva fue confirmada. Estos son los detalles:</p>
                    <table style="width: 100%%; border-collapse: collapse; margin: 16px 0;">
                        <tr style="border-bottom: 1px solid #333;">
                            <td style="padding: 8px 0; color: #a1a1aa;">Cancha</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">%s</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #333;">
                            <td style="padding: 8px 0; color: #a1a1aa;">Fecha</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">%s</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #333;">
                            <td style="padding: 8px 0; color: #a1a1aa;">Horario</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a1a1aa;">Precio total</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ccff00;">$%s</td>
                        </tr>
                    </table>
                    <p style="color: #a1a1aa; font-size: 13px;">Recorda abonar el resto ($%s) al llegar a la cancha.</p>
                    <p style="margin-top: 24px; color: #a1a1aa; font-size: 12px;">— %s</p>
                </div>
                """.formatted(
                    nombre,
                    cancha,
                    fecha,
                    horario,
                    reserva.getPrecioTotal().toPlainString(),
                    reserva.getPrecioTotal().subtract(reserva.getSena()).toPlainString(),
                    config.getTitular()
            );

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(config.getEmailRemitente());
            helper.setTo(to);
            helper.setSubject("Tu reserva fue confirmada - " + config.getTitular());
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email de confirmacion enviado a {} para reserva #{}", to, reserva.getId());

        } catch (MessagingException e) {
            log.error("Error al enviar email de confirmacion para reserva #{}: {}", reserva.getId(), e.getMessage());
        }
    }


    @Async
    public void enviarRecordatorio(Reserva reserva) {
        try {
            ConfigPago config = configPagoService.getConfig();

            if (config.getEmailRemitente() == null || config.getEmailPassword() == null) {
                log.warn("Email no configurado — no se envio recordatorio para reserva #{}", reserva.getId());
                return;
            }

            JavaMailSender mailSender = createMailSender(config.getEmailRemitente(), config.getEmailPassword());

            String to = reserva.getUsuario().getEmail();
            String nombre = reserva.getUsuario().getNombre();
            String cancha = reserva.getCancha().getNombre();
            String horario = reserva.getHoraInicio() + " - " + reserva.getHoraFin();
            String resto = reserva.getPrecioTotal().subtract(reserva.getSena()).toPlainString();

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
                    <h2 style="color: #ccff00; margin-top: 0;">Tu turno es en 1 hora</h2>
                    <p>Hola <strong>%s</strong>, te recordamos que tenes un turno pronto:</p>
                    <table style="width: 100%%; border-collapse: collapse; margin: 16px 0;">
                        <tr style="border-bottom: 1px solid #333;">
                            <td style="padding: 8px 0; color: #a1a1aa;">Cancha</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">%s</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #333;">
                            <td style="padding: 8px 0; color: #a1a1aa;">Horario</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a1a1aa;">Resto a abonar</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ccff00;">$%s</td>
                        </tr>
                    </table>
                    <p style="color: #a1a1aa; font-size: 13px;">Recorda llevar el resto del pago. Te esperamos!</p>
                    <p style="margin-top: 24px; color: #a1a1aa; font-size: 12px;">— %s</p>
                </div>
                """.formatted(nombre, cancha, horario, resto, config.getTitular());

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(config.getEmailRemitente());
            helper.setTo(to);
            helper.setSubject("Recordatorio: tu turno es en 1 hora - " + config.getTitular());
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Recordatorio enviado a {} para reserva #{}", to, reserva.getId());

        } catch (MessagingException e) {
            log.error("Error al enviar recordatorio para reserva #{}: {}", reserva.getId(), e.getMessage());
        }
    }
}

package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.EstadoReserva;
import com.estadio.api.canchas.model.Reserva;
import com.estadio.api.canchas.service.IReservaService;
import com.estadio.api.canchas.service.MercadoPagoService;
import com.mercadopago.resources.payment.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Endpoint que Mercado Pago llama automáticamente cuando ocurre un evento de pago.
 * Este endpoint debe ser público (sin autenticación JWT).
 */
@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final IReservaService reservaService;
    private final MercadoPagoService mercadoPagoService;

    @Value("${mercadopago.webhook.secret:dev-secret}")
    private String webhookSecret;

    @Value("${mercadopago.webhook.validate-signature:false}")
    private boolean validateSignature;

    /**
     * Mercado Pago envía una notificación POST con el tipo de evento y el ID del recurso.
     * Nosotros solo nos interesa el evento "payment" con action "payment.created" o "payment.updated".
     *
     * Flujo:
     * 1. MP nos avisa que hubo un pago
     * 2. Consultamos el pago por ID para verificar el estado real
     * 3. Si está aprobado, buscamos la reserva por external_reference y la confirmamos
     */
    @PostMapping("/mercadopago")
    public ResponseEntity<String> mercadoPagoWebhook(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "data.id", required = false) String dataId,
            @RequestHeader(value = "x-signature", required = false) String xSignature,
            @RequestHeader(value = "x-request-id", required = false) String xRequestId,
            @RequestBody(required = false) Map<String, Object> body) {

        log.info("Webhook MP recibido - type: {}, data.id: {}", type, dataId);

        // Validar firma HMAC-SHA256 de Mercado Pago (solo en produccion)
        if (validateSignature && !validarFirmaWebhook(xSignature, xRequestId, dataId)) {
            log.warn("Webhook MP rechazado: firma invalida. x-signature={}", xSignature);
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            // MP puede enviar la notificación de dos formas:
            // 1. Query params: ?type=payment&data.id=12345
            // 2. Body JSON: { "type": "payment", "data": { "id": "12345" } }
            Long paymentId = null;

            if ("payment".equals(type) && dataId != null) {
                paymentId = Long.parseLong(dataId);
            } else if (body != null) {
                String bodyType = body.get("type") != null ? body.get("type").toString() : "";
                if ("payment".equals(bodyType) && body.get("data") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    if (data.get("id") != null) {
                        paymentId = Long.parseLong(data.get("id").toString());
                    }
                }
            }

            if (paymentId == null) {
                // No es un evento de pago — respondemos 200 para que MP no reintente
                log.info("Webhook MP ignorado: no es un evento de pago");
                return ResponseEntity.ok("OK");
            }

            // Consultar el pago real en MP para verificar el estado
            Payment payment = mercadoPagoService.consultarPago(paymentId);
            String status = payment.getStatus();
            String externalReference = payment.getExternalReference();

            log.info("Pago MP #{} - estado: {}, referencia: {}", paymentId, status, externalReference);

            if (externalReference == null) {
                log.warn("Pago sin external_reference, ignorando");
                return ResponseEntity.ok("OK");
            }

            Long reservaId = Long.parseLong(externalReference);
            Reserva reserva = reservaService.findById(reservaId).orElse(null);

            if (reserva == null) {
                log.warn("Reserva #{} no encontrada para pago MP #{}", reservaId, paymentId);
                return ResponseEntity.ok("OK");
            }

            // Solo procesar si la reserva está PENDIENTE
            if (reserva.getEstado() != EstadoReserva.PENDIENTE) {
                log.info("Reserva #{} ya tiene estado {}, ignorando webhook", reservaId, reserva.getEstado());
                return ResponseEntity.ok("OK");
            }

            if ("approved".equals(status)) {
                // Pago aprobado → confirmar reserva automáticamente
                reserva.setMpPaymentId(paymentId);
                reserva.setEstado(EstadoReserva.CONFIRMADA);
                reservaService.save(reserva);
                log.info("Reserva #{} CONFIRMADA automáticamente por pago MP #{}", reservaId, paymentId);

                // Enviar email de confirmación
                reservaService.notificarConfirmacion(reserva);

            } else if ("rejected".equals(status) || "cancelled".equals(status)) {
                log.info("Pago MP #{} rechazado/cancelado para reserva #{}", paymentId, reservaId);
                // No cancelamos la reserva inmediatamente — el usuario puede reintentar
                // El scheduler se encarga de cancelar si expira el tiempo
            }
            // "pending" y "in_process" → no hacer nada, esperar

        } catch (Exception e) {
            log.error("Error procesando webhook de MP: {}", e.getMessage(), e);
            // Respondemos 200 igualmente para que MP no reintente infinitamente
        }

        return ResponseEntity.ok("OK");
    }

    /**
     * Valida la firma HMAC-SHA256 que Mercado Pago incluye en el header x-signature.
     * Formato del header: ts=<timestamp>,v1=<hash>
     * Manifest firmado: id:<dataId>;request-id:<xRequestId>;ts:<timestamp>;
     *
     * Documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
     */
    private boolean validarFirmaWebhook(String xSignature, String xRequestId, String dataId) {
        if (xSignature == null || xSignature.isBlank()) return false;

        try {
            String ts = null;
            String v1 = null;
            for (String part : xSignature.split(",")) {
                String[] kv = part.split("=", 2);
                if (kv.length == 2) {
                    if ("ts".equals(kv[0].trim()))  ts = kv[1].trim();
                    if ("v1".equals(kv[0].trim()))  v1 = kv[1].trim();
                }
            }

            if (ts == null || v1 == null) return false;

            // Manifest: solo incluir las partes que no sean null
            StringBuilder manifest = new StringBuilder();
            if (dataId != null)     manifest.append("id:").append(dataId).append(";");
            if (xRequestId != null) manifest.append("request-id:").append(xRequestId).append(";");
            manifest.append("ts:").append(ts).append(";");

            String manifestStr = manifest.toString();
            String manifestSinSemicolon = manifestStr.replaceAll(";$", "");

            byte[] secretUtf8 = webhookSecret.getBytes(StandardCharsets.UTF_8);
            byte[] secretHex  = hexToBytes(webhookSecret);

            // Intentar todas las combinaciones (UTF-8 vs hex-decoded, con/sin semicolon final)
            // para máxima compatibilidad entre sandbox y producción de MP
            return (v1.equals(calcHmac(secretUtf8, manifestStr)))
                || (v1.equals(calcHmac(secretUtf8, manifestSinSemicolon)))
                || (v1.equals(calcHmac(secretHex,  manifestStr)))
                || (v1.equals(calcHmac(secretHex,  manifestSinSemicolon)));

        } catch (Exception e) {
            log.error("Error validando firma webhook MP: {}", e.getMessage());
            return false;
        }
    }

    private String calcHmac(byte[] secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}

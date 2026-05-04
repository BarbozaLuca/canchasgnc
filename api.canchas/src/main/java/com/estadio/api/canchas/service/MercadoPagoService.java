package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.model.Reserva;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.*;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MercadoPagoService {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoService.class);

    /**
     * Tasa total de Mercado Pago trasladada al jugador.
     * Comisión "Al instante": 4,4 %  +  IVA (21 % sobre la comisión) = 4,4 × 1,21 = 5,324 %
     * Se usa la fórmula de "recibir neto": senaMp = sena / (1 − TASA)
     * así el dueño recibe exactamente `sena` después de que MP descuenta su fee.
     */
    public static final BigDecimal TASA_MP = new BigDecimal("0.053119"); // 4,4 % × 1,21

    private final ConfigPagoService configPagoService;

    // Token de fallback desde env var — se usa solo si la DB no tiene uno configurado.
    // En producción multi-cliente, cada complejo debe configurar su propio token desde el panel.
    @Value("${mercadopago.access.token:}")
    private String accessTokenFallback;

    @Value("${mercadopago.frontend.url}")
    private String frontendUrl;

    @Value("${mercadopago.webhook.url:}")
    private String webhookUrl;

    /**
     * Obtiene el Access Token efectivo con esta prioridad:
     * 1. OAuth (vinculación con "Vincular con MP") — si está activo y no vencido
     * 2. Manual (pegado a mano en el panel)
     * 3. Env var MP_ACCESS_TOKEN (fallback / dev)
     */
    private String getAccessToken() {
        ConfigPago config = configPagoService.getConfig();

        // 1. OAuth — prioridad máxima
        if (config.getMpOauthAccessToken() != null && !config.getMpOauthAccessToken().isBlank()) {
            if (config.getMpOauthExpiresAt() != null
                    && config.getMpOauthExpiresAt().isAfter(java.time.LocalDateTime.now())) {
                return config.getMpOauthAccessToken();
            }
            log.warn("Token OAuth de MP vencido. Usando fallback si existe.");
        }

        // 2. Token manual (configurado desde el panel admin)
        if (config.getMpAccessToken() != null && !config.getMpAccessToken().isBlank()) {
            return config.getMpAccessToken();
        }

        // 3. Env var (dev / single-tenant sin panel)
        if (accessTokenFallback != null && !accessTokenFallback.isBlank()) {
            return accessTokenFallback;
        }

        log.error("No hay Access Token de Mercado Pago configurado (OAuth, manual ni env var)");
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "El complejo aún no configuró sus credenciales de Mercado Pago. Contactá al administrador.");
    }

    /**
     * Crea una preferencia de pago en Mercado Pago para la seña de una reserva.
     *
     * @param reserva La reserva con el monto de la seña a cobrar
     * @return El objeto Preference con el init_point (URL de pago)
     */
    public Preference crearPreferencia(Reserva reserva) {
        try {
            MercadoPagoConfig.setAccessToken(getAccessToken());

            PreferenceClient client = new PreferenceClient();

            // Monto real que paga el jugador: sena / (1 − tasa) → el dueño recibe sena neta
            BigDecimal senaMp = reserva.getSena()
                    .divide(BigDecimal.ONE.subtract(TASA_MP), 2, RoundingMode.HALF_UP);

            // Item: la seña del turno
            PreferenceItemRequest item = PreferenceItemRequest.builder()
                    .id("reserva-" + reserva.getId())
                    .title("Seña - " + reserva.getCancha().getNombre()
                            + " | " + reserva.getFecha() + " " + reserva.getHoraInicio()
                            + "-" + reserva.getHoraFin())
                    .quantity(1)
                    .unitPrice(senaMp)
                    .currencyId("ARS")
                    .build();

            // Configuración de la preferencia
            PreferenceRequest.PreferenceRequestBuilder builder = PreferenceRequest.builder()
                    .items(List.of(item))
                    .externalReference(reserva.getId().toString())
                    .expires(true)
                    .expirationDateTo(reserva.getFechaCreacion()
                            .plusMinutes(15)
                            .atZone(java.time.ZoneId.of("America/Argentina/Buenos_Aires"))
                            .toOffsetDateTime());

            // URL de webhook para notificaciones de pago
            if (webhookUrl != null && !webhookUrl.isBlank()) {
                builder.notificationUrl(webhookUrl + "/api/webhooks/mercadopago");
            }

            // back_urls y autoReturn solo funcionan con URLs públicas (no localhost)
            if (!frontendUrl.contains("localhost")) {
                PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                        .success(frontendUrl + "/pago/exito")
                        .pending(frontendUrl + "/pago/pendiente")
                        .failure(frontendUrl + "/pago/error")
                        .build();
                builder.backUrls(backUrls).autoReturn("approved");
            }

            PreferenceRequest request = builder.build();

            return client.create(request);

        } catch (MPApiException e) {
            log.error("MP API Error - Status: {} - Response: {}", e.getStatusCode(), e.getApiResponse().getContent());
            throw new RuntimeException("Error al crear preferencia de Mercado Pago: " + e.getApiResponse().getContent(), e);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al crear preferencia de Mercado Pago: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta un pago por ID para verificar su estado.
     *
     * @param paymentId ID del pago en Mercado Pago
     * @return El objeto Payment con toda la info del pago
     */
    public Payment consultarPago(Long paymentId) {
        try {
            MercadoPagoConfig.setAccessToken(getAccessToken());
            PaymentClient client = new PaymentClient();
            return client.get(paymentId);
        } catch (Exception e) {
            throw new RuntimeException("Error al consultar pago en Mercado Pago: " + e.getMessage(), e);
        }
    }
}

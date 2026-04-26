package com.estadio.api.canchas.config;

import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.service.ConfigPagoService;
import com.estadio.api.canchas.service.MercadoPagoOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Refresca el access token de Mercado Pago automáticamente antes de que venza.
 *
 * MP emite tokens con vigencia de 6 meses (15552000 segundos).
 * Este scheduler corre una vez por día y renueva el token si vence en menos de 30 días.
 *
 * Sin este scheduler, el admin tendría que re-vincular manualmente cada 6 meses.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MpTokenRefreshScheduler {

    private final ConfigPagoService configPagoService;
    private final MercadoPagoOAuthService oauthService;

    // Corre todos los días a las 03:00 AM
    @Scheduled(cron = "0 0 3 * * *")
    public void refrescarTokenSiNecesario() {
        ConfigPago config = configPagoService.getConfig();

        if (config.getMpOauthRefreshToken() == null || config.getMpOauthRefreshToken().isBlank()) {
            // No hay OAuth configurado, nada que hacer
            return;
        }

        LocalDateTime expiresAt = config.getMpOauthExpiresAt();
        if (expiresAt == null) {
            log.warn("MpTokenRefresh: hay refresh token pero no fecha de vencimiento, refrescando por precaución");
            doRefresh();
            return;
        }

        // Refrescar si vence en menos de 30 días
        LocalDateTime umbral = LocalDateTime.now().plusDays(30);
        if (expiresAt.isBefore(umbral)) {
            log.info("MpTokenRefresh: token vence el {} — refrescando ahora", expiresAt);
            doRefresh();
        } else {
            log.debug("MpTokenRefresh: token vigente hasta {} — sin acción necesaria", expiresAt);
        }
    }

    private void doRefresh() {
        try {
            oauthService.refreshAccessToken();
            log.info("MpTokenRefresh: token renovado exitosamente");
        } catch (Exception e) {
            log.error("MpTokenRefresh: error al renovar token: {}", e.getMessage(), e);
            // No lanzar — el scheduler no debe romperse. El admin verá el estado en el panel.
        }
    }
}

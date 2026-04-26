package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.service.ConfigPagoService;
import com.estadio.api.canchas.service.MercadoPagoOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Endpoints para el flujo OAuth con Mercado Pago.
 *
 * GET  /api/oauth/mercadopago/connect     → devuelve la URL de autorización (admin)
 * GET  /api/oauth/mercadopago/callback    → MP redirige acá con el code (público)
 * POST /api/oauth/mercadopago/disconnect  → desvincula la cuenta (admin)
 * GET  /api/oauth/mercadopago/status      → estado actual de la conexión (admin)
 */
@Slf4j
@RestController
@RequestMapping("/api/oauth/mercadopago")
@RequiredArgsConstructor
public class MercadoPagoOAuthController {

    private final MercadoPagoOAuthService oauthService;
    private final ConfigPagoService configPagoService;

    @Value("${mercadopago.frontend.url}")
    private String frontendUrl;

    /**
     * El admin hace clic en "Vincular con Mercado Pago" → el frontend llama a este endpoint
     * y redirige al usuario a la URL que recibe.
     */
    @GetMapping("/connect")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> getAuthorizeUrl() {
        String url = oauthService.buildAuthorizeUrl();
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * MP redirige acá después de que el usuario autoriza (o cancela).
     * Este endpoint es PÚBLICO — MP no envía autenticación JWT.
     *
     * Procesa el code, guarda los tokens en DB y redirige al panel admin.
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(value = "code",  required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error) {

        // Si el usuario canceló la autorización en MP
        if (error != null || code == null) {
            log.warn("OAuth MP: callback con error o sin code. error={}", error);
            return ResponseEntity.status(302)
                    .location(URI.create(frontendUrl + "/panel?tab=config&mp=cancelled"))
                    .build();
        }

        try {
            oauthService.exchangeCode(code, state);
            log.info("OAuth MP: vinculación exitosa");
            return ResponseEntity.status(302)
                    .location(URI.create(frontendUrl + "/panel?tab=config&mp=connected"))
                    .build();
        } catch (IllegalArgumentException e) {
            // State inválido o expirado
            log.warn("OAuth MP: {}", e.getMessage());
            return ResponseEntity.status(302)
                    .location(URI.create(frontendUrl + "/panel?tab=config&mp=error&reason=invalid_state"))
                    .build();
        } catch (Exception e) {
            log.error("OAuth MP: error al procesar callback: {}", e.getMessage(), e);
            return ResponseEntity.status(302)
                    .location(URI.create(frontendUrl + "/panel?tab=config&mp=error&reason=server_error"))
                    .build();
        }
    }

    /**
     * El admin hace clic en "Desvincular" → borra todos los tokens OAuth de la DB.
     */
    @PostMapping("/disconnect")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> disconnect() {
        oauthService.disconnect();
        return ResponseEntity.ok(Map.of(
                "mpOauthConectado", "false",
                "message", "Cuenta de Mercado Pago desvinculada correctamente"
        ));
    }

    /**
     * Devuelve el estado actual de la conexión OAuth (sin exponer tokens).
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> status() {
        ConfigPago config = configPagoService.getConfig();
        boolean conectado = configPagoService.isOauthConectado();

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("conectado", conectado);
        resp.put("userId",    conectado ? config.getMpOauthUserId() : null);
        resp.put("expiresAt", conectado && config.getMpOauthExpiresAt() != null
                ? config.getMpOauthExpiresAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : null);
        resp.put("via", config.getMpConectadoVia());

        return ResponseEntity.ok(resp);
    }
}

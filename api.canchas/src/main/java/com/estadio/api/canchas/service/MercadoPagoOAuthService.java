package com.estadio.api.canchas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Maneja el flujo OAuth 2.0 con Mercado Pago.
 *
 * Flujo:
 * 1. buildAuthorizeUrl()  → URL a la que se redirige al admin para autorizar
 * 2. exchangeCode()       → intercambia el código de autorización por tokens
 * 3. refreshAccessToken() → renueva el access token usando el refresh token
 * 4. disconnect()         → borra los tokens de la DB
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MercadoPagoOAuthService {

    private final ConfigPagoService configPagoService;

    @Value("${mercadopago.oauth.client-id:}")
    private String clientId;

    @Value("${mercadopago.oauth.client-secret:}")
    private String clientSecret;

    @Value("${mercadopago.oauth.redirect-uri:}")
    private String redirectUri;

    // Almacenamiento temporal de estados OAuth para CSRF protection
    // key = state UUID, value = timestamp de creación
    private final ConcurrentHashMap<String, Long> pendingStates = new ConcurrentHashMap<>();
    private static final long STATE_TTL_MS = 10 * 60 * 1000L; // 10 minutos

    private static final String MP_AUTH_URL  = "https://auth.mercadopago.com.ar/authorization";
    private static final String MP_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

    // ── 1. Construir URL de autorización ─────────────────────────────────────

    /**
     * Genera la URL a la que se redirige al admin para que autorice la app en MP.
     * Incluye un 'state' UUID para prevenir CSRF.
     */
    public String buildAuthorizeUrl() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException(
                "Las variables MP_OAUTH_CLIENT_ID y MP_OAUTH_CLIENT_SECRET no están configuradas en el servidor.");
        }
        limpiarStatesExpirados();

        String state = UUID.randomUUID().toString();
        pendingStates.put(state, System.currentTimeMillis());

        return MP_AUTH_URL
                + "?client_id=" + clientId
                + "&response_type=code"
                + "&platform_id=mp"
                + "&state=" + state
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
    }

    // ── 2. Intercambiar código por tokens ─────────────────────────────────────

    /**
     * Recibe el 'code' que MP envía en el callback y lo intercambia por
     * access_token + refresh_token. Guarda los tokens en la DB.
     */
    public void exchangeCode(String code, String state) {
        // Validar state (CSRF protection)
        Long createdAt = pendingStates.remove(state);
        if (createdAt == null || System.currentTimeMillis() - createdAt > STATE_TTL_MS) {
            log.warn("OAuth MP: state inválido o expirado: {}", state);
            throw new IllegalArgumentException("Estado OAuth inválido o expirado. Intentá vincular de nuevo.");
        }

        String body = buildFormBody(Map.of(
                "grant_type",    "authorization_code",
                "client_id",     clientId,
                "client_secret", clientSecret,
                "code",          code,
                "redirect_uri",  redirectUri
        ));

        String responseBody = postToMp(body);
        saveTokensFromResponse(responseBody);

        log.info("OAuth MP: cuenta vinculada exitosamente. User ID: {}", extractJsonLong(responseBody, "user_id"));
    }

    // ── 3. Refrescar access token ─────────────────────────────────────────────

    /**
     * Usa el refresh_token para obtener un nuevo access_token antes de que expire.
     */
    public void refreshAccessToken() {
        com.estadio.api.canchas.model.ConfigPago config = configPagoService.getConfig();
        String refreshToken = config.getMpOauthRefreshToken();

        if (refreshToken == null || refreshToken.isBlank()) {
            log.debug("OAuth MP: no hay refresh token configurado");
            return;
        }

        log.info("OAuth MP: refrescando access token...");

        String body = buildFormBody(Map.of(
                "grant_type",    "refresh_token",
                "client_id",     clientId,
                "client_secret", clientSecret,
                "refresh_token", refreshToken
        ));

        String responseBody = postToMp(body);
        saveTokensFromResponse(responseBody);

        log.info("OAuth MP: access token renovado exitosamente");
    }

    // ── 4. Desconectar ────────────────────────────────────────────────────────

    public void disconnect() {
        configPagoService.clearOAuthTokens();
        log.info("OAuth MP: cuenta desvinculada");
    }

    // ── Helpers HTTP ──────────────────────────────────────────────────────────

    private String postToMp(String formBody) {
        try {
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(MP_TOKEN_URL))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            String body = response.body();

            if (response.statusCode() != 200) {
                String error = extractJsonString(body, "error");
                String desc  = extractJsonString(body, "error_description");
                // Log completo para diagnóstico
                log.error("OAuth MP error {} | body completo: {}", response.statusCode(), body);
                log.error("OAuth MP | client_id usado: {} | redirect_uri usado: {}", clientId, redirectUri);
                throw new RuntimeException("Error de Mercado Pago: "
                        + (desc != null ? desc : error != null ? error : "status " + response.statusCode()));
            }

            return body;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al comunicarse con Mercado Pago: " + e.getMessage(), e);
        }
    }

    private void saveTokensFromResponse(String json) {
        String accessToken  = extractJsonString(json, "access_token");
        String refreshToken = extractJsonString(json, "refresh_token");
        Long   userId       = extractJsonLong(json, "user_id");
        long   expiresIn    = extractJsonLong(json, "expires_in") != null
                              ? extractJsonLong(json, "expires_in") : 15552000L;

        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expiresIn);

        if (accessToken == null || accessToken.isBlank()) {
            throw new RuntimeException("MP no devolvió access_token en la respuesta OAuth");
        }

        configPagoService.saveOAuthTokens(accessToken, refreshToken, userId, expiresAt);
    }

    // ── Helpers JSON mínimo (sin Jackson) ─────────────────────────────────────

    /** Extrae el valor de un campo string de un JSON plano. */
    private String extractJsonString(String json, String key) {
        if (json == null) return null;
        // Busca: "key": "value"  o  "key":"value"
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]+)\"");
        Matcher m = p.matcher(json);
        return m.find() ? m.group(1) : null;
    }

    /** Extrae el valor de un campo numérico de un JSON plano. */
    private Long extractJsonLong(String json, String key) {
        if (json == null) return null;
        // Busca: "key": 12345  o  "key":12345
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(\\d+)");
        Matcher m = p.matcher(json);
        return m.find() ? Long.parseLong(m.group(1)) : null;
    }

    // ── Helpers generales ─────────────────────────────────────────────────────

    private String buildFormBody(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        params.forEach((k, v) -> {
            if (sb.length() > 0) sb.append("&");
            sb.append(URLEncoder.encode(k, StandardCharsets.UTF_8))
              .append("=")
              .append(URLEncoder.encode(v, StandardCharsets.UTF_8));
        });
        return sb.toString();
    }

    private void limpiarStatesExpirados() {
        long now = System.currentTimeMillis();
        pendingStates.entrySet().removeIf(e -> now - e.getValue() > STATE_TTL_MS);
    }
}

package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.service.ConfigPagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/config-pago")
@RequiredArgsConstructor
public class ConfigPagoController {

    private static final Pattern TIME_PATTERN = Pattern.compile("^\\d{2}:\\d{2}$");
    // Formato de access token de MP: "APP_USR-..." (prod) o "TEST-..." (sandbox)
    private static final Pattern MP_TOKEN_PATTERN = Pattern.compile("^(APP_USR|TEST)-[A-Za-z0-9\\-]{20,}$");

    private final ConfigPagoService configPagoService;

    /**
     * Enmascara el token dejando visibles solo los últimos 4 caracteres.
     * Ejemplo: "APP_USR-1234567890-abcdef" → "APP_USR-****cdef"
     */
    private String enmascararToken(String token) {
        if (token == null || token.isBlank()) return "";
        if (token.length() <= 12) return "****";
        String prefix = token.startsWith("APP_USR-") ? "APP_USR-" : (token.startsWith("TEST-") ? "TEST-" : "");
        String last4 = token.substring(token.length() - 4);
        return prefix + "****" + last4;
    }

    // Cualquier usuario autenticado puede ver el alias y titular (para la pantalla de pago)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> getConfig() {
        ConfigPago config = configPagoService.getConfig();
        Map<String, String> resp = new HashMap<>();
        resp.put("alias", config.getAlias());
        resp.put("titular", config.getTitular());
        return ResponseEntity.ok(resp);
    }

    // Público — para mostrar ubicación y whatsapp en la landing sin necesidad de login
    @GetMapping("/publica")
    public ResponseEntity<Map<String, String>> getPublicConfig() {
        ConfigPago config = configPagoService.getConfig();
        Map<String, String> resp = new HashMap<>();
        resp.put("ubicacionUrl", config.getUbicacionUrl() != null ? config.getUbicacionUrl() : "");
        resp.put("horaApertura", config.getHoraApertura() != null ? config.getHoraApertura() : "17:00");
        resp.put("horaCierre", config.getHoraCierre() != null ? config.getHoraCierre() : "01:00");
        resp.put("horaReservaDesde", config.getHoraReservaDesde() != null ? config.getHoraReservaDesde() : "10:00");
        resp.put("horaReservaHasta", config.getHoraReservaHasta() != null ? config.getHoraReservaHasta() : "19:00");
        resp.put("whatsapp", config.getWhatsapp() != null ? config.getWhatsapp() : "");
        return ResponseEntity.ok(resp);
    }

    // Solo el admin puede ver la config completa (incluye email)
    @GetMapping("/full")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> getFullConfig() {
        ConfigPago config = configPagoService.getConfig();
        Map<String, String> resp = new HashMap<>();
        resp.put("alias", config.getAlias());
        resp.put("titular", config.getTitular());
        resp.put("emailRemitente", config.getEmailRemitente() != null ? config.getEmailRemitente() : "");
        resp.put("emailConfigured", config.getEmailRemitente() != null && config.getEmailPassword() != null ? "true" : "false");
        resp.put("ubicacionUrl", config.getUbicacionUrl() != null ? config.getUbicacionUrl() : "");
        resp.put("horaApertura", config.getHoraApertura() != null ? config.getHoraApertura() : "17:00");
        resp.put("horaCierre", config.getHoraCierre() != null ? config.getHoraCierre() : "01:00");
        resp.put("horaReservaDesde", config.getHoraReservaDesde() != null ? config.getHoraReservaDesde() : "10:00");
        resp.put("horaReservaHasta", config.getHoraReservaHasta() != null ? config.getHoraReservaHasta() : "19:00");
        resp.put("whatsapp", config.getWhatsapp() != null ? config.getWhatsapp() : "");
        // Token de MP enmascarado — nunca se devuelve el completo
        String mpToken = config.getMpAccessToken();
        resp.put("mpTokenConfigured", (mpToken != null && !mpToken.isBlank()) ? "true" : "false");
        resp.put("mpTokenMasked", enmascararToken(mpToken));
        resp.put("mpTokenTipo", mpToken != null && mpToken.startsWith("TEST-") ? "TEST" :
                                (mpToken != null && mpToken.startsWith("APP_USR-") ? "PROD" : ""));
        return ResponseEntity.ok(resp);
    }

    // Solo el admin puede modificar pago
    @PatchMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateConfig(@RequestBody Map<String, String> body) {
        String alias = body.get("alias");
        String titular = body.get("titular");
        if (alias != null && alias.trim().length() > 100) {
            return ResponseEntity.badRequest().build();
        }
        if (titular != null && titular.trim().length() > 100) {
            return ResponseEntity.badRequest().build();
        }
        ConfigPago config = configPagoService.updateConfig(
                alias != null ? alias.trim() : null,
                titular != null ? titular.trim() : null);
        Map<String, String> resp = new HashMap<>();
        resp.put("alias", config.getAlias());
        resp.put("titular", config.getTitular());
        return ResponseEntity.ok(resp);
    }

    // Solo el admin puede modificar ubicación
    @PatchMapping("/ubicacion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateUbicacion(@RequestBody Map<String, String> body) {
        String url = body.get("ubicacionUrl");
        if (url != null && url.trim().length() > 1000) {
            return ResponseEntity.badRequest().build();
        }
        ConfigPago config = configPagoService.getConfig();
        config.setUbicacionUrl(url != null ? url.trim() : null);
        configPagoService.saveConfig(config);
        Map<String, String> resp = new HashMap<>();
        resp.put("ubicacionUrl", config.getUbicacionUrl() != null ? config.getUbicacionUrl() : "");
        return ResponseEntity.ok(resp);
    }

    // Solo el admin puede modificar horario de apertura/cierre
    @PatchMapping("/horario")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateHorario(@RequestBody Map<String, String> body) {
        String horaApertura = body.get("horaApertura");
        String horaCierre = body.get("horaCierre");
        if (horaApertura == null || horaCierre == null) {
            return ResponseEntity.badRequest().build();
        }
        if (!TIME_PATTERN.matcher(horaApertura.trim()).matches() || !TIME_PATTERN.matcher(horaCierre.trim()).matches()) {
            return ResponseEntity.badRequest().build();
        }
        ConfigPago config = configPagoService.updateHorario(horaApertura.trim(), horaCierre.trim());
        Map<String, String> resp = new HashMap<>();
        resp.put("horaApertura", config.getHoraApertura());
        resp.put("horaCierre", config.getHoraCierre());
        return ResponseEntity.ok(resp);
    }

    // Solo el admin puede modificar email
    @PatchMapping("/email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateEmail(@RequestBody Map<String, String> body) {
        String email = body.get("emailRemitente");
        String password = body.get("emailPassword");
        if (email != null && email.trim().length() > 255) {
            return ResponseEntity.badRequest().build();
        }
        if (password != null && password.trim().length() > 255) {
            return ResponseEntity.badRequest().build();
        }
        ConfigPago config = configPagoService.updateEmail(email, password);
        Map<String, String> resp = new HashMap<>();
        resp.put("emailRemitente", config.getEmailRemitente() != null ? config.getEmailRemitente() : "");
        resp.put("emailConfigured", config.getEmailRemitente() != null && config.getEmailPassword() != null ? "true" : "false");
        return ResponseEntity.ok(resp);
    }

    /**
     * Solo el admin puede configurar el Access Token de Mercado Pago del complejo.
     * NUNCA se devuelve el token completo; solo un estado y versión enmascarada.
     * Para borrarlo, enviar mpAccessToken = "" (vacío) → vuelve al fallback de env var.
     */
    @PatchMapping("/mp-token")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateMpAccessToken(@RequestBody Map<String, String> body) {
        String token = body.get("mpAccessToken");
        // Validación: si viene algo, debe ser un token de MP válido en forma
        if (token != null && !token.isBlank()) {
            String trimmed = token.trim();
            if (trimmed.length() > 500 || !MP_TOKEN_PATTERN.matcher(trimmed).matches()) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "El Access Token no tiene un formato válido. Debe empezar con APP_USR- o TEST-.");
                return ResponseEntity.badRequest().body(err);
            }
        }
        ConfigPago config = configPagoService.updateMpAccessToken(token);
        Map<String, String> resp = new HashMap<>();
        String saved = config.getMpAccessToken();
        resp.put("mpTokenConfigured", (saved != null && !saved.isBlank()) ? "true" : "false");
        resp.put("mpTokenMasked", enmascararToken(saved));
        resp.put("mpTokenTipo", saved != null && saved.startsWith("TEST-") ? "TEST" :
                                (saved != null && saved.startsWith("APP_USR-") ? "PROD" : ""));
        return ResponseEntity.ok(resp);
    }

    // Solo el admin puede modificar WhatsApp
    @PatchMapping("/whatsapp")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateWhatsapp(@RequestBody Map<String, String> body) {
        String whatsapp = body.get("whatsapp");
        ConfigPago config = configPagoService.getConfig();
        config.setWhatsapp(whatsapp != null && !whatsapp.isBlank() ? whatsapp.trim() : null);
        configPagoService.saveConfig(config);
        Map<String, String> resp = new HashMap<>();
        resp.put("whatsapp", config.getWhatsapp() != null ? config.getWhatsapp() : "");
        return ResponseEntity.ok(resp);
    }
}

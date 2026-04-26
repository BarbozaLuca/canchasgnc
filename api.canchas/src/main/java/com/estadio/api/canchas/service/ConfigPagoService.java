package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.repository.ConfigPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ConfigPagoService {

    private final ConfigPagoRepository repository;

    @Value("${pago.alias}")
    private String aliasDefault;

    /**
     * Devuelve la config de pago. Si no existe en la BD, crea una con los valores por defecto.
     */
    public ConfigPago getConfig() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(new ConfigPago(
                        null, aliasDefault, "Complejo GNC",
                        null, null, null,
                        "17:00", "01:00", "10:00", "19:00",
                        null,  // whatsapp
                        null,  // mpAccessToken (manual)
                        null, null, null, null, null  // OAuth fields
                )));
    }

    public ConfigPago saveConfig(ConfigPago config) {
        return repository.save(config);
    }

    public ConfigPago updateConfig(String alias, String titular) {
        ConfigPago config = getConfig();
        config.setAlias(alias);
        config.setTitular(titular);
        return repository.save(config);
    }

    public ConfigPago updateHorario(String horaApertura, String horaCierre) {
        ConfigPago config = getConfig();
        config.setHoraApertura(horaApertura);
        config.setHoraCierre(horaCierre);
        return repository.save(config);
    }

    /**
     * Genera los slots de 1 hora entre apertura y cierre.
     * Soporta horarios que cruzan medianoche (ej: 17:00 a 01:00).
     */
    public LocalTime[][] generarSlots() {
        ConfigPago config = getConfig();
        String apertura = config.getHoraApertura() != null ? config.getHoraApertura() : "17:00";
        String cierre   = config.getHoraCierre()   != null ? config.getHoraCierre()   : "01:00";

        LocalTime inicio = LocalTime.parse(apertura);
        LocalTime fin    = LocalTime.parse(cierre);

        ArrayList<LocalTime[]> slots = new ArrayList<>();
        LocalTime current = inicio;

        for (int i = 0; i < 24; i++) {
            LocalTime next = current.plusHours(1);
            slots.add(new LocalTime[]{current, next});
            if (next.equals(fin)) break;
            current = next;
        }

        return slots.toArray(new LocalTime[0][]);
    }

    // ── Manual token ─────────────────────────────────────────────────────────

    public ConfigPago updateMpAccessToken(String mpAccessToken) {
        ConfigPago config = getConfig();
        if (mpAccessToken != null && !mpAccessToken.isBlank()) {
            config.setMpAccessToken(mpAccessToken.trim());
            config.setMpConectadoVia("MANUAL");
        } else {
            config.setMpAccessToken(null);
            // Si no queda OAuth tampoco, limpiar el estado
            if (config.getMpOauthAccessToken() == null) {
                config.setMpConectadoVia(null);
            }
        }
        return repository.save(config);
    }

    // ── OAuth tokens ──────────────────────────────────────────────────────────

    /**
     * Guarda los tokens recibidos del flujo OAuth de Mercado Pago.
     * También limpia el token manual si existía (OAuth tiene prioridad).
     */
    public ConfigPago saveOAuthTokens(String accessToken, String refreshToken,
                                      Long userId, LocalDateTime expiresAt) {
        ConfigPago config = getConfig();
        config.setMpOauthAccessToken(accessToken);
        config.setMpOauthRefreshToken(refreshToken);
        config.setMpOauthUserId(userId);
        config.setMpOauthExpiresAt(expiresAt);
        config.setMpConectadoVia("OAUTH");
        return repository.save(config);
    }

    /**
     * Borra todos los datos OAuth (desvincula la cuenta de MP).
     */
    public ConfigPago clearOAuthTokens() {
        ConfigPago config = getConfig();
        config.setMpOauthAccessToken(null);
        config.setMpOauthRefreshToken(null);
        config.setMpOauthUserId(null);
        config.setMpOauthExpiresAt(null);
        config.setMpConectadoVia(config.getMpAccessToken() != null ? "MANUAL" : null);
        return repository.save(config);
    }

    /**
     * Verdadero si hay una conexión OAuth activa (token no vencido).
     */
    public boolean isOauthConectado() {
        ConfigPago config = getConfig();
        return config.getMpOauthAccessToken() != null
                && config.getMpOauthExpiresAt() != null
                && config.getMpOauthExpiresAt().isAfter(LocalDateTime.now());
    }

    public ConfigPago updateEmail(String emailRemitente, String emailPassword) {
        ConfigPago config = getConfig();
        if (emailRemitente != null && !emailRemitente.isBlank()) {
            config.setEmailRemitente(emailRemitente.trim());
        }
        if (emailPassword != null && !emailPassword.isBlank()) {
            config.setEmailPassword(emailPassword.trim());
        }
        return repository.save(config);
    }
}

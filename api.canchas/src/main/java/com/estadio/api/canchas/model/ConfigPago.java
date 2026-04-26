package com.estadio.api.canchas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "config_pago")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConfigPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Size(max = 100)
    private String alias;

    @Column(nullable = false)
    @Size(max = 100)
    private String titular;

    // Email SMTP para notificaciones
    @Size(max = 255)
    private String emailRemitente;
    @Size(max = 255)
    private String emailPassword;

    // Ubicación del complejo (URL de Google Maps)
    @Size(max = 1000)
    private String ubicacionUrl;

    // Horario de apertura y cierre del complejo (ej: "17:00", "01:00")
    @Size(max = 5)
    private String horaApertura;
    @Size(max = 5)
    private String horaCierre;

    // Horario permitido para reservar (ej: "10:00", "19:00")
    @Size(max = 5)
    private String horaReservaDesde;
    @Size(max = 5)
    private String horaReservaHasta;

    // WhatsApp del complejo (ej: "5493515551234")
    @Size(max = 20)
    private String whatsapp;

    // ── Mercado Pago — token manual (fallback / modo avanzado) ──────────────
    // Si está null y hay OAuth activo, se usa el token OAuth
    // Si ambos son null, se usa el de env var
    @Column(length = 500)
    @Size(max = 500)
    private String mpAccessToken;

    // ── Mercado Pago — OAuth ─────────────────────────────────────────────────
    // Estos campos se llenan automáticamente cuando el dueño hace "Vincular con MP"

    // Access token recibido vía OAuth (se refresca automáticamente)
    @Column(length = 500)
    private String mpOauthAccessToken;

    // Refresh token para renovar el access token antes de que expire
    @Column(length = 500)
    private String mpOauthRefreshToken;

    // ID de usuario de Mercado Pago del dueño del complejo
    private Long mpOauthUserId;

    // Cuándo vence el access token OAuth
    private LocalDateTime mpOauthExpiresAt;

    // "MANUAL" | "OAUTH" — indica cómo se configuró el token activo
    @Size(max = 10)
    private String mpConectadoVia;
}

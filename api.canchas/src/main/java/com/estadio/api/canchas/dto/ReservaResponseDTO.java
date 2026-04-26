package com.estadio.api.canchas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReservaResponseDTO {

    private Long id;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;

    @JsonProperty("precioTotal")
    private BigDecimal precioTotal;

    private BigDecimal sena;
    private String estado;
    private String comprobante;
    private String comprobanteUrl;

    // Timestamp de expiración para el countdown del frontend (fechaCreacion + limiteMinutos)
    private LocalDateTime expiresAt;

    // Info de pago — solo se muestra cuando la reserva está PENDIENTE
    private String aliasPago;
    private String titularPago;
    private String mensajePago;

    // URL de Mercado Pago para pagar la seña
    private String mpInitPoint;
    private Long mpPaymentId;

    // Solo datos esenciales del usuario
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;

    // Nombre del cliente para reservas presenciales (puede ser null)
    private String nombrePresencial;

    // Solo datos esenciales de la cancha
    private Long canchaId;
    private String canchaNombre;
}

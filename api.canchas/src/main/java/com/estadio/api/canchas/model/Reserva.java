package com.estadio.api.canchas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime horaInicio;

    @Column(nullable = false)
    private LocalTime horaFin;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioTotal;

    // Siempre es el 50% del precioTotal — se calcula en el servidor al crear la reserva
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sena;

    // Se setea automáticamente al crear — sirve para calcular el vencimiento del pago
    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    // Nro de operación o referencia que el cliente envía tras transferir la seña
    @Size(max = 255, message = "El comprobante no puede superar los 255 caracteres")
    private String comprobante;

    // Ruta a la imagen del comprobante de transferencia subida por el cliente
    @Size(max = 500)
    private String comprobanteUrl;

    // ID de preferencia de Mercado Pago (para trackear el link de pago)
    private String mpPreferenceId;

    // ID del pago aprobado en Mercado Pago
    private Long mpPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoReserva estado;

    // Flag para evitar enviar el recordatorio más de una vez
    @Column(columnDefinition = "boolean default false")
    private boolean recordatorioEnviado;

    // Nombre del cliente para reservas presenciales creadas por staff (sin cuenta en el sistema)
    @Size(max = 255)
    private String nombrePresencial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancha_id", nullable = false)
    private Cancha cancha;
}

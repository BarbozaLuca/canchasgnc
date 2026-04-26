package com.estadio.api.canchas.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class ReservaRequestDTO {

    @NotNull(message = "La cancha es obligatoria")
    private Long canchaId;

    // El usuarioId se obtiene del SecurityContext en el controller
    private Long usuarioId;

    @NotNull(message = "La fecha es obligatoria")
    @FutureOrPresent(message = "No se puede reservar en una fecha pasada")
    private LocalDate fecha;

    @NotNull(message = "La hora de inicio es obligatoria")
    private LocalTime horaInicio;

    @NotNull(message = "La hora de fin es obligatoria")
    private LocalTime horaFin;

    // Opcional: nombre del cliente para reservas presenciales creadas por staff
    private String nombrePresencial;
}

package com.estadio.api.canchas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TurnoFijoDTO {
    private Long id;
    private String diaSemana;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String fechaInicio;
    private String fechaFin;
    private boolean activo;
    private String createdAt;

    // Info del usuario
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;

    // Info de la cancha
    private Long canchaId;
    private String canchaNombre;
}

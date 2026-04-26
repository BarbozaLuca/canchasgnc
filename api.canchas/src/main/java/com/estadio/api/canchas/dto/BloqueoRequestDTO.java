package com.estadio.api.canchas.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class BloqueoRequestDTO {

    @NotNull(message = "La cancha es obligatoria")
    @JsonProperty("cancha_id")
    private Long canchaId;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @JsonProperty("hora_inicio")
    private LocalTime horaInicio;

    @JsonProperty("hora_fin")
    private LocalTime horaFin;

    @Size(max = 200, message = "El motivo no puede superar los 200 caracteres")
    private String motivo;

    @JsonProperty("todo_dia")
    private boolean todoDia;
}

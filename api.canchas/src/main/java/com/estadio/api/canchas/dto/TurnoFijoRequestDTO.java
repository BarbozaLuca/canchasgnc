package com.estadio.api.canchas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TurnoFijoRequestDTO {
    @NotNull(message = "El usuario es obligatorio")
    private Long usuarioId;

    @NotNull(message = "La cancha es obligatoria")
    private Long canchaId;

    @NotBlank(message = "El día de la semana es obligatorio")
    @Size(max = 10)
    private String diaSemana;  // MONDAY, TUESDAY, etc.

    @NotBlank(message = "La hora de inicio es obligatoria")
    @Pattern(regexp = "^\\d{2}:\\d{2}$", message = "Formato de hora inválido (HH:mm)")
    private String horaInicio; // "21:00"

    @NotBlank(message = "La hora de fin es obligatoria")
    @Pattern(regexp = "^\\d{2}:\\d{2}$", message = "Formato de hora inválido (HH:mm)")
    private String horaFin;    // "22:00"

    @Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "Formato de fecha inválido (yyyy-MM-dd)")
    private String fechaFin;   // "2026-04-30" (opcional, null = indefinido)
}

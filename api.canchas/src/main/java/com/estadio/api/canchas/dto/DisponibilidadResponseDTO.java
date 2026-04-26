package com.estadio.api.canchas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DisponibilidadResponseDTO {

    private List<HorarioSlotDTO> horarios;
}

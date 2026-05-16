package com.estadio.api.canchas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class HorarioSlotDTO {

    private String horaInicio;
    private String horaFin;
    private boolean disponible;
    private boolean tieneDescuento;
    private Integer porcentajeDescuento;
    private BigDecimal precioConDescuento;
}

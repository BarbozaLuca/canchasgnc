package com.estadio.api.canchas.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StaffPermissionsDTO {
    private boolean puedeVerReservas;
    private boolean puedeCrearReservas;
    private boolean puedeCambiarEstado;
    private boolean puedeGestionarBloqueos;
    private boolean puedeGestionarTurnosFijos;
    private boolean puedeVerFacturacion;
    private boolean puedeGestionarDescuentos;
    private boolean puedePublicarTurnos;
}

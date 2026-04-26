package com.estadio.api.canchas.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    private Long id;
    private String nombre;
    private String email;

    @JsonProperty("rol_id")
    private Long rolId;

    @JsonProperty("rol_nombre")
    private String rolNombre;

    @JsonProperty("activo")
    private boolean enabled;

    private boolean puedeVerReservas;
    private boolean puedeCrearReservas;
    private boolean puedeCambiarEstado;
    private boolean puedeGestionarBloqueos;
    private boolean puedeGestionarTurnosFijos;
}

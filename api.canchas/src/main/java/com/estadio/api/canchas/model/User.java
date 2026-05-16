package com.estadio.api.canchas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Size(max = 100)
    private String nombre;

    @Column(nullable = false, unique = true)
    @Size(max = 255)
    private String email;

    @Size(max = 20)
    private String celular;

    @JsonIgnore
    private String password;

    // Indica si el usuario se registró con Google (no tiene contraseña propia)
    @Column(columnDefinition = "boolean default false")
    private boolean googleUser;

    @JsonIgnore
    private boolean enabled = true;
    @JsonIgnore
    private boolean accountNoExpired = true;
    @JsonIgnore
    private boolean accountNoLocked = true;
    @JsonIgnore
    private boolean credentialNoExpired = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id")
    private Rol rol;

    // Permisos granulares para usuarios con rol STAFF (admin siempre tiene acceso total)
    @Column(columnDefinition = "boolean default true")
    private boolean puedeVerReservas = true;

    @Column(columnDefinition = "boolean default true")
    private boolean puedeCrearReservas = true;

    @Column(columnDefinition = "boolean default true")
    private boolean puedeCambiarEstado = true;

    @Column(columnDefinition = "boolean default true")
    private boolean puedeGestionarBloqueos = true;

    @Column(columnDefinition = "boolean default true")
    private boolean puedeGestionarTurnosFijos = true;

    @Column(columnDefinition = "boolean default true")
    private boolean puedeGestionarDescuentos = true;

    @Column(columnDefinition = "boolean default false")
    private boolean puedeVerFacturacion = false;

    @Column(columnDefinition = "boolean default false")
    private boolean puedePublicarTurnos = false;
}

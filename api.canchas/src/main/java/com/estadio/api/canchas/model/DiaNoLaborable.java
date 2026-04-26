package com.estadio.api.canchas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "dias_no_laborables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiaNoLaborable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate fecha;

    // Motivo del cierre (ej: "Feriado", "Mantenimiento general", "Evento privado")
    @Size(max = 200)
    private String motivo;
}

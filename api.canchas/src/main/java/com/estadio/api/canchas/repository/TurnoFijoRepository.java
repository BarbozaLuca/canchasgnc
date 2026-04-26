package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.TurnoFijo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TurnoFijoRepository extends JpaRepository<TurnoFijo, Long> {

    // Todos los turnos fijos activos y vigentes para una fecha (scheduler y disponibilidad)
    @Query("""
            SELECT t FROM TurnoFijo t
            WHERE t.activo = true
              AND (t.fechaFin IS NULL OR t.fechaFin >= :fecha)
            """)
    List<TurnoFijo> findVigentes(@Param("fecha") LocalDate fecha);

    // Turnos fijos de una cancha y dia, vigentes para una fecha (para bloquear slots)
    @Query("""
            SELECT t FROM TurnoFijo t
            WHERE t.cancha.id = :canchaId
              AND t.diaSemana = :diaSemana
              AND t.activo = true
              AND (t.fechaFin IS NULL OR t.fechaFin >= :fecha)
            """)
    List<TurnoFijo> findVigentesByCanchaAndDia(
            @Param("canchaId") Long canchaId,
            @Param("diaSemana") DayOfWeek diaSemana,
            @Param("fecha") LocalDate fecha);

    // Verificar conflicto: mismo slot, misma cancha, vigente
    @Query("""
            SELECT COUNT(t) > 0 FROM TurnoFijo t
            WHERE t.cancha.id = :canchaId
              AND t.diaSemana = :diaSemana
              AND t.horaInicio = :horaInicio
              AND t.activo = true
              AND (t.fechaFin IS NULL OR t.fechaFin >= :hoy)
            """)
    boolean existeConflicto(
            @Param("canchaId") Long canchaId,
            @Param("diaSemana") DayOfWeek diaSemana,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("hoy") LocalDate hoy);
}

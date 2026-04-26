package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.EstadoReserva;
import com.estadio.api.canchas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    // Historial de reservas de un usuario
    List<Reserva> findByUsuarioId(Long usuarioId);

    // Reservas de una cancha en un día específico (para mostrar disponibilidad)
    List<Reserva> findByCanchaIdAndFecha(Long canchaId, LocalDate fecha);

    // Candado de seguridad a nivel Java: detecta solapamiento de horarios
    // Cubre los 3 casos posibles de superposición entre dos rangos horarios
    @Query("""
            SELECT COUNT(r) > 0 FROM Reserva r
            WHERE r.cancha.id = :canchaId
              AND r.fecha = :fecha
              AND r.estado <> 'CANCELADA'
              AND r.horaInicio < :horaFin
              AND r.horaFin > :horaInicio
            """)
    boolean existeSolapamiento(@Param("canchaId") Long canchaId,
                               @Param("fecha") LocalDate fecha,
                               @Param("horaInicio") LocalTime horaInicio,
                               @Param("horaFin") LocalTime horaFin);

    // Busca reservas PENDIENTES creadas hace más de X minutos (para auto-cancelar)
    @Query("SELECT r FROM Reserva r WHERE r.estado = 'PENDIENTE' AND r.fechaCreacion < :limite")
    List<Reserva> findPendientesVencidas(@Param("limite") LocalDateTime limite);

    // Facturación: reservas CONFIRMADAS o COMPLETADAS en un rango de fechas
    @Query("SELECT r FROM Reserva r WHERE r.estado IN ('CONFIRMADA', 'COMPLETADA') AND r.fecha BETWEEN :desde AND :hasta")
    List<Reserva> findConfirmadasEntre(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    // Cantidad de reservas por estado en un rango
    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.estado = :estado AND r.fecha BETWEEN :desde AND :hasta")
    int countByEstadoEntre(@Param("estado") EstadoReserva estado, @Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    // Total de reservas (cualquier estado excepto CANCELADA) en un rango
    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.estado <> 'CANCELADA' AND r.fecha BETWEEN :desde AND :hasta")
    int countActivasEntre(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    // Reservas confirmadas de hoy que empiezan entre horaDesde y horaHasta y no tienen recordatorio enviado
    @Query("""
            SELECT r FROM Reserva r
            WHERE r.estado = 'CONFIRMADA'
              AND r.fecha = :fecha
              AND r.horaInicio BETWEEN :horaDesde AND :horaHasta
              AND r.recordatorioEnviado = false
            """)
    List<Reserva> findParaRecordatorio(@Param("fecha") LocalDate fecha,
                                       @Param("horaDesde") LocalTime horaDesde,
                                       @Param("horaHasta") LocalTime horaHasta);
}

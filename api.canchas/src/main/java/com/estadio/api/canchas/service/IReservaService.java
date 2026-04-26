package com.estadio.api.canchas.service;

import com.estadio.api.canchas.dto.FacturacionDTO;
import com.estadio.api.canchas.dto.ReservaRequestDTO;
import com.estadio.api.canchas.model.EstadoReserva;
import com.estadio.api.canchas.model.Reserva;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IReservaService {

    List<Reserva> findAll();

    Optional<Reserva> findById(Long id);

    // Historial de reservas de un usuario
    List<Reserva> findByUsuarioId(Long usuarioId);

    // Horarios ocupados de una cancha en un día (para mostrar disponibilidad)
    List<Reserva> findByCanchaIdAndFecha(Long canchaId, LocalDate fecha);

    // Crea la reserva: valida horarios, verifica cancha activa y calcula el precio
    Reserva crear(ReservaRequestDTO dto);

    // Cambia el estado a CANCELADA y libera el horario
    Reserva cancelar(Long id);

    // Avanza el estado de la reserva (PENDIENTE → CONFIRMADA → COMPLETADA)
    Reserva cambiarEstado(Long id, EstadoReserva nuevoEstado);

    // Guarda cambios en una reserva existente
    Reserva save(Reserva reserva);

    // Cancela automáticamente reservas PENDIENTES que superaron el límite de tiempo
    void cancelarReservasVencidas();

    // Estadísticas de facturación para el panel admin
    FacturacionDTO getFacturacion();

    // Envía recordatorio por email 1h antes del turno
    void enviarRecordatorios();

    // Envía email de confirmación al usuario cuando el pago fue aprobado por MP
    void notificarConfirmacion(Reserva reserva);

    // Genera reservas automaticas a partir de turnos fijos para la proxima semana
    void generarReservasDeTurnosFijos();

}

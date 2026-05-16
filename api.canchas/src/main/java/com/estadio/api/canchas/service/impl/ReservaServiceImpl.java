package com.estadio.api.canchas.service.impl;

import com.estadio.api.canchas.dto.FacturacionDTO;
import com.estadio.api.canchas.dto.ReservaRequestDTO;
import com.estadio.api.canchas.model.*;
import com.estadio.api.canchas.repository.*;
import com.estadio.api.canchas.service.IReservaService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservaServiceImpl implements IReservaService {

    private static final Logger log = LoggerFactory.getLogger(ReservaServiceImpl.class);

    private final ReservaRepository reservaRepository;
    private final CanchaRepository canchaRepository;
    private final UserRepository userRepository;
    private final NotificacionRepository notificacionRepository;
    private final TurnoFijoRepository turnoFijoRepository;
    private final DescuentoRepository descuentoRepository;
    private final com.estadio.api.canchas.service.EmailService emailService;

    private java.util.List<String> getStaffAndAdminEmails() {
        java.util.List<String> emails = new java.util.ArrayList<>();
        userRepository.findByRol_RolNameAndEnabledTrue("ROLE_STAFF")
                .forEach(u -> emails.add(u.getEmail()));
        userRepository.findByRol_RolNameAndEnabledTrue("ROLE_ADMIN")
                .forEach(u -> emails.add(u.getEmail()));
        return emails;
    }

    @Value("${pago.limite.minutos}")
    private int limiteMinutos;

    @Override
    public List<Reserva> findAll() {
        return reservaRepository.findAll();
    }

    @Override
    public Optional<Reserva> findById(Long id) {
        return reservaRepository.findById(id);
    }

    @Override
    public List<Reserva> findByUsuarioId(Long usuarioId) {
        return reservaRepository.findByUsuarioId(usuarioId);
    }

    @Override
    public List<Reserva> findByCanchaIdAndFecha(Long canchaId, LocalDate fecha) {
        return reservaRepository.findByCanchaIdAndFecha(canchaId, fecha);
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Reserva crear(ReservaRequestDTO dto) {

        // Validación 0: la fecha debe estar dentro del rango permitido (hoy + 10 días)
        LocalDate hoy = LocalDate.now();
        if (dto.getFecha().isBefore(hoy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se puede reservar en una fecha pasada.");
        }
        if (dto.getFecha().isAfter(hoy.plusDays(10))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se puede reservar con hasta 10 días de anticipación.");
        }

        // Validación 1: horaFin debe ser posterior a horaInicio
        // Excepción: se permite cruce de medianoche (ej: 23:00→00:00, 00:00→01:00)
        boolean cruzaMedianoche = dto.getHoraFin().equals(LocalTime.MIDNIGHT)
                || dto.getHoraFin().isBefore(dto.getHoraInicio());
        if (!cruzaMedianoche && !dto.getHoraFin().isAfter(dto.getHoraInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La hora de fin debe ser posterior a la hora de inicio.");
        }

        // Validación 2: la cancha debe existir y estar activa
        Cancha cancha = canchaRepository.findById(dto.getCanchaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "La cancha indicada no existe."));

        if (!cancha.getActiva()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La cancha no está disponible (en mantenimiento).");
        }

        // Validación 3: el usuario debe existir
        User usuario = userRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "El usuario indicado no existe."));

        // Validación 3b: el usuario debe tener celular cargado (necesario para contacto)
        if (usuario.getCelular() == null || usuario.getCelular().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Tenes que cargar un numero de celular en tu perfil antes de reservar.");
        }

        // Validación 4: no debe haber solapamiento de horarios
        boolean hayConflicto = reservaRepository.existeSolapamiento(
                dto.getCanchaId(), dto.getFecha(), dto.getHoraInicio(), dto.getHoraFin()
        );
        if (hayConflicto) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El horario solicitado ya está ocupado para esa cancha.");
        }

        // Cálculo de horas (maneja turnos que cruzan medianoche)
        long minutos = Duration.between(dto.getHoraInicio(), dto.getHoraFin()).toMinutes();
        if (minutos <= 0) {
            minutos += 1440;
        }
        BigDecimal horas = BigDecimal.valueOf(minutos).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        // Aplicar descuento si existe para este slot
        BigDecimal precioBase = cancha.getPrecioHora().setScale(2, RoundingMode.HALF_UP);
        Optional<Descuento> descuento = descuentoRepository
                .findByCanchaIdAndFechaAndHoraInicio(cancha.getId(), dto.getFecha(), dto.getHoraInicio());
        BigDecimal precioPorHora = descuento
                .map(d -> precioBase.multiply(BigDecimal.valueOf(100 - d.getPorcentaje()))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
                .orElse(precioBase);
        BigDecimal precioTotal = precioPorHora.multiply(horas).setScale(2, RoundingMode.HALF_UP);

        // Regla de negocio: la seña es siempre el 50% del precio total
        BigDecimal sena = precioTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        // Construcción y persistencia
        Reserva reserva = new Reserva();
        reserva.setCancha(cancha);
        reserva.setUsuario(usuario);
        reserva.setFecha(dto.getFecha());
        reserva.setHoraInicio(dto.getHoraInicio());
        reserva.setHoraFin(dto.getHoraFin());
        reserva.setPrecioTotal(precioTotal);
        reserva.setSena(sena);
        reserva.setFechaCreacion(LocalDateTime.now());
        reserva.setEstado(EstadoReserva.PENDIENTE);

        Reserva saved = reservaRepository.save(reserva);

        return saved;
    }

    @Override
    @Transactional
    public Reserva cancelar(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Reserva no encontrada con id: " + id));

        if (reserva.getEstado() == EstadoReserva.COMPLETADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede cancelar una reserva ya completada.");
        }

        reserva.setEstado(EstadoReserva.CANCELADA);
        Reserva saved = reservaRepository.save(reserva);

        // Crear notificacion in-app para el usuario
        saved.getUsuario().getNombre();
        saved.getCancha().getNombre();
        crearNotificacion(saved, EstadoReserva.CANCELADA);

        return saved;
    }

    @Override
    @Transactional
    public Reserva cambiarEstado(Long id, EstadoReserva nuevoEstado) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Reserva no encontrada con id: " + id));

        reserva.setEstado(nuevoEstado);
        Reserva saved = reservaRepository.save(reserva);

        // Forzar carga de relaciones LAZY antes del @Async
        saved.getUsuario().getEmail();
        saved.getCancha().getNombre();

        // Enviar email de confirmación al usuario cuando el staff confirma la reserva
        if (nuevoEstado == EstadoReserva.CONFIRMADA) {
            emailService.enviarConfirmacion(saved);
        }

        // Crear notificacion in-app para el usuario
        crearNotificacion(saved, nuevoEstado);

        return saved;
    }

    @Override
    public Reserva save(Reserva reserva) {
        return reservaRepository.save(reserva);
    }

    @Override
    public void notificarConfirmacion(Reserva reserva) {
        reserva.getUsuario().getEmail(); // forzar carga LAZY antes del @Async
        reserva.getUsuario().getNombre();
        reserva.getCancha().getNombre();
        emailService.enviarConfirmacion(reserva);
        crearNotificacion(reserva, EstadoReserva.CONFIRMADA);
    }

    @Override
    @Transactional
    public void cancelarReservasVencidas() {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(limiteMinutos);
        List<Reserva> vencidas = reservaRepository.findPendientesVencidas(limite);

        if (!vencidas.isEmpty()) {
            vencidas.forEach(r -> r.setEstado(EstadoReserva.CANCELADA));
            reservaRepository.saveAll(vencidas);
            log.info("Se cancelaron {} reservas vencidas (sin pago en {} minutos).", vencidas.size(), limiteMinutos);
        }
    }

    @Override
    public FacturacionDTO getFacturacion() {
        LocalDate hoy = LocalDate.now();
        // Lunes de esta semana
        LocalDate inicioSemana = hoy.with(java.time.DayOfWeek.MONDAY);
        // Primer día del mes
        LocalDate inicioMes = hoy.withDayOfMonth(1);

        // Facturado = CONFIRMADA suma solo la seña (50% cobrado por transferencia)
        //            COMPLETADA suma el precioTotal (el cliente ya pagó todo)
        BigDecimal facturadoHoy = sumarCobrado(reservaRepository.findConfirmadasEntre(hoy, hoy));
        BigDecimal facturadoSemana = sumarCobrado(reservaRepository.findConfirmadasEntre(inicioSemana, hoy));
        BigDecimal facturadoMes = sumarCobrado(reservaRepository.findConfirmadasEntre(inicioMes, hoy));

        // Cantidad de reservas activas por periodo
        int reservasHoy = reservaRepository.countActivasEntre(hoy, hoy);
        int reservasSemana = reservaRepository.countActivasEntre(inicioSemana, hoy);
        int reservasMes = reservaRepository.countActivasEntre(inicioMes, hoy);

        // Canceladas y completadas del mes
        int canceladasMes = reservaRepository.countByEstadoEntre(EstadoReserva.CANCELADA, inicioMes, hoy);
        int completadasMes = reservaRepository.countByEstadoEntre(EstadoReserva.COMPLETADA, inicioMes, hoy);

        return new FacturacionDTO(facturadoHoy, facturadoSemana, facturadoMes,
                reservasHoy, reservasSemana, reservasMes, canceladasMes, completadasMes);
    }

    /**
     * Crea una notificacion in-app para el usuario cuando cambia el estado de su reserva.
     */
    private void crearNotificacion(Reserva reserva, EstadoReserva estado) {
        String canchaNombre = reserva.getCancha().getNombre();
        String fecha = reserva.getFecha().toString();
        String hora = reserva.getHoraInicio().toString();

        String mensaje;
        switch (estado) {
            case CONFIRMADA -> mensaje = "Tu reserva en " + canchaNombre + " para el " + fecha + " a las " + hora + " fue confirmada!";
            case CANCELADA -> mensaje = "Tu reserva en " + canchaNombre + " para el " + fecha + " a las " + hora + " fue cancelada.";
            case COMPLETADA -> mensaje = "Tu reserva en " + canchaNombre + " para el " + fecha + " a las " + hora + " fue marcada como completada.";
            default -> mensaje = "Tu reserva en " + canchaNombre + " para el " + fecha + " fue actualizada a " + estado.name() + ".";
        }

        Notificacion notif = new Notificacion();
        notif.setTipo(estado.name());
        notif.setMensaje(mensaje);
        notif.setLeida(false);
        notif.setCreatedAt(LocalDateTime.now());
        notif.setUsuario(reserva.getUsuario());
        notif.setReserva(reserva);
        notificacionRepository.save(notif);
    }

    /**
     * Calcula el dinero realmente cobrado:
     * - CONFIRMADA → solo la seña fue cobrada (transferencia)
     * - COMPLETADA → el precio total fue cobrado (seña + resto en efectivo)
     */
    private BigDecimal sumarCobrado(List<Reserva> reservas) {
        return reservas.stream()
                .map(r -> r.getEstado() == EstadoReserva.COMPLETADA
                        ? r.getPrecioTotal()
                        : r.getSena())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    @Transactional
    public void enviarRecordatorios() {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        // Buscar reservas que empiezan entre ahora+50min y ahora+70min (ventana de 20 min para no perder ninguna)
        LocalTime desde = ahora.plusMinutes(50);
        LocalTime hasta = ahora.plusMinutes(70);

        // Si la ventana cruza medianoche, no buscar (caso borde poco probable)
        if (desde.isAfter(hasta)) return;

        List<Reserva> reservas = reservaRepository.findParaRecordatorio(hoy, desde, hasta);

        for (Reserva r : reservas) {
            r.getUsuario().getEmail();  // forzar carga LAZY
            r.getCancha().getNombre();
            emailService.enviarRecordatorio(r);
            r.setRecordatorioEnviado(true);
            reservaRepository.save(r);
            log.info("Recordatorio programado para reserva #{} ({} a las {})", r.getId(), r.getCancha().getNombre(), r.getHoraInicio());
        }
    }

    @Override
    @Transactional
    public void generarReservasDeTurnosFijos() {
        LocalDate hoy = LocalDate.now();
        List<TurnoFijo> turnos = turnoFijoRepository.findVigentes(hoy);
        if (turnos.isEmpty()) return;

        int generadas = 0;

        for (TurnoFijo turno : turnos) {
            // Generar para los proximos 7 dias
            for (int i = 0; i < 7; i++) {
                LocalDate fecha = hoy.plusDays(i);
                if (fecha.getDayOfWeek() != turno.getDiaSemana()) continue;

                // Respetar la fecha de fin del turno fijo
                if (turno.getFechaFin() != null && fecha.isAfter(turno.getFechaFin())) continue;

                // Verificar que no exista ya una reserva para ese slot
                boolean hayConflicto = reservaRepository.existeSolapamiento(
                        turno.getCancha().getId(), fecha, turno.getHoraInicio(), turno.getHoraFin());
                if (hayConflicto) continue;

                // Crear la reserva automaticamente como CONFIRMADA
                BigDecimal precioTotal = turno.getCancha().getPrecioHora();
                BigDecimal sena = precioTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

                Reserva reserva = new Reserva();
                reserva.setCancha(turno.getCancha());
                reserva.setUsuario(turno.getUsuario());
                reserva.setFecha(fecha);
                reserva.setHoraInicio(turno.getHoraInicio());
                reserva.setHoraFin(turno.getHoraFin());
                reserva.setPrecioTotal(precioTotal);
                reserva.setSena(sena);
                reserva.setFechaCreacion(LocalDateTime.now());
                reserva.setEstado(EstadoReserva.CONFIRMADA);
                reserva.setComprobante("TURNO FIJO");
                reservaRepository.save(reserva);
                generadas++;
            }
        }

        if (generadas > 0) {
            log.info("Se generaron {} reservas automaticas desde turnos fijos.", generadas);
        }
    }

}

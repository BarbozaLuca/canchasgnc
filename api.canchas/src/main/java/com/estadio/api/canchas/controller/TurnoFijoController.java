package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.dto.TurnoFijoDTO;
import com.estadio.api.canchas.dto.TurnoFijoRequestDTO;
import com.estadio.api.canchas.model.Cancha;
import com.estadio.api.canchas.model.TurnoFijo;
import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.repository.CanchaRepository;
import com.estadio.api.canchas.repository.TurnoFijoRepository;
import com.estadio.api.canchas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/turnos-fijos")
@RequiredArgsConstructor
public class TurnoFijoController {

    private final TurnoFijoRepository turnoFijoRepository;
    private final UserRepository userRepository;
    private final CanchaRepository canchaRepository;

    // Listar todos los turnos fijos
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<TurnoFijoDTO>> getAll() {
        List<TurnoFijoDTO> turnos = turnoFijoRepository.findAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(turnos);
    }

    // Crear un turno fijo
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'GESTIONAR_TURNOS'))")
    public ResponseEntity<TurnoFijoDTO> crear(@RequestBody TurnoFijoRequestDTO req) {
        User usuario = userRepository.findById(req.getUsuarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        Cancha cancha = canchaRepository.findById(req.getCanchaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cancha no encontrada"));

        DayOfWeek dia = DayOfWeek.valueOf(req.getDiaSemana());
        LocalTime horaInicio = LocalTime.parse(req.getHoraInicio());
        LocalTime horaFin = LocalTime.parse(req.getHoraFin());

        // Verificar que no exista un turno fijo en el mismo slot
        boolean existe = turnoFijoRepository.existeConflicto(cancha.getId(), dia, horaInicio, LocalDate.now());
        if (existe) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un turno fijo para esa cancha, dia y horario.");
        }
        LocalDate fechaInicio = req.getFechaInicio() != null && !req.getFechaInicio().isBlank()
                ? LocalDate.parse(req.getFechaInicio()) : LocalDate.now();

        LocalDate fechaFin = req.getFechaFin() != null && !req.getFechaFin().isBlank()
                ? LocalDate.parse(req.getFechaFin()) : null;

        if (fechaFin != null && fechaFin.isBefore(fechaInicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        TurnoFijo turno = new TurnoFijo();
        turno.setUsuario(usuario);
        turno.setCancha(cancha);
        turno.setDiaSemana(dia);
        turno.setHoraInicio(horaInicio);
        turno.setHoraFin(horaFin);
        turno.setFechaInicio(fechaInicio);
        turno.setFechaFin(fechaFin);
        turno.setActivo(true);
        turno.setCreatedAt(LocalDateTime.now());

        TurnoFijo saved = turnoFijoRepository.save(turno);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    // Activar/desactivar un turno fijo
    @PatchMapping("/toggle/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'GESTIONAR_TURNOS'))")
    public ResponseEntity<Map<String, String>> toggle(@PathVariable Long id) {
        TurnoFijo turno = turnoFijoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno fijo no encontrado"));
        turno.setActivo(!turno.isActivo());
        turnoFijoRepository.save(turno);
        return ResponseEntity.ok(Map.of("message", turno.isActivo() ? "Turno fijo activado" : "Turno fijo desactivado"));
    }

    // Eliminar un turno fijo
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'GESTIONAR_TURNOS'))")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable Long id) {
        if (!turnoFijoRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno fijo no encontrado");
        }
        turnoFijoRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Turno fijo eliminado"));
    }

    private TurnoFijoDTO toDto(TurnoFijo t) {
        TurnoFijoDTO dto = new TurnoFijoDTO();
        dto.setId(t.getId());
        dto.setDiaSemana(t.getDiaSemana().name());
        dto.setHoraInicio(t.getHoraInicio());
        dto.setHoraFin(t.getHoraFin());
        dto.setFechaInicio(t.getFechaInicio() != null ? t.getFechaInicio().toString() : null);
        dto.setFechaFin(t.getFechaFin() != null ? t.getFechaFin().toString() : null);
        dto.setActivo(t.isActivo());
        dto.setCreatedAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        dto.setUsuarioId(t.getUsuario().getId());
        dto.setUsuarioNombre(t.getUsuario().getNombre());
        dto.setUsuarioEmail(t.getUsuario().getEmail());
        dto.setCanchaId(t.getCancha().getId());
        dto.setCanchaNombre(t.getCancha().getNombre());
        return dto;
    }
}

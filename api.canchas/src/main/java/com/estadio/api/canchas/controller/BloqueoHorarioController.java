package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.dto.BloqueoRequestDTO;
import com.estadio.api.canchas.model.BloqueoHorario;
import com.estadio.api.canchas.model.Cancha;
import com.estadio.api.canchas.repository.BloqueoHorarioRepository;
import com.estadio.api.canchas.repository.CanchaRepository;
import com.estadio.api.canchas.service.ConfigPagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bloqueos")
@RequiredArgsConstructor
public class BloqueoHorarioController {

    private final BloqueoHorarioRepository bloqueoRepository;
    private final CanchaRepository canchaRepository;
    private final ConfigPagoService configPagoService;

    // Listar bloqueos vigentes (desde hoy)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<BloqueoHorario> bloqueos = bloqueoRepository
                .findByFechaGreaterThanEqualOrderByFechaAscHoraInicioAsc(LocalDate.now());

        List<Map<String, Object>> response = bloqueos.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("canchaId", b.getCancha().getId());
            map.put("canchaNombre", b.getCancha().getNombre());
            map.put("fecha", b.getFecha().toString());
            map.put("horaInicio", b.getHoraInicio().toString());
            map.put("horaFin", b.getHoraFin().toString());
            map.put("motivo", b.getMotivo());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    // Crear bloqueo (uno o todos los horarios del día)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'GESTIONAR_BLOQUEOS'))")
    public ResponseEntity<List<Map<String, Object>>> crear(@RequestBody BloqueoRequestDTO dto) {
        Cancha cancha = canchaRepository.findById(dto.getCanchaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cancha no encontrada."));

        List<BloqueoHorario> nuevos = new ArrayList<>();

        if (dto.isTodoDia()) {
            // Obtener bloqueos existentes para evitar duplicados
            List<BloqueoHorario> existentes = bloqueoRepository.findByCanchaIdAndFecha(dto.getCanchaId(), dto.getFecha());
            Set<LocalTime> horasYaBloqueadas = existentes.stream()
                    .map(BloqueoHorario::getHoraInicio)
                    .collect(Collectors.toSet());

            LocalTime[][] slots = configPagoService.generarSlots();
            for (LocalTime[] slot : slots) {
                if (!horasYaBloqueadas.contains(slot[0])) {
                    BloqueoHorario bloqueo = new BloqueoHorario();
                    bloqueo.setCancha(cancha);
                    bloqueo.setFecha(dto.getFecha());
                    bloqueo.setHoraInicio(slot[0]);
                    bloqueo.setHoraFin(slot[1]);
                    bloqueo.setMotivo(dto.getMotivo() != null ? dto.getMotivo() : "Bloqueado por admin");
                    nuevos.add(bloqueo);
                }
            }
        } else {
            BloqueoHorario bloqueo = new BloqueoHorario();
            bloqueo.setCancha(cancha);
            bloqueo.setFecha(dto.getFecha());
            bloqueo.setHoraInicio(dto.getHoraInicio());
            bloqueo.setHoraFin(dto.getHoraFin());
            bloqueo.setMotivo(dto.getMotivo());
            nuevos.add(bloqueo);
        }

        List<BloqueoHorario> savedList = bloqueoRepository.saveAll(nuevos);

        List<Map<String, Object>> response = savedList.stream().map(saved -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", saved.getId());
            map.put("canchaId", cancha.getId());
            map.put("canchaNombre", cancha.getNombre());
            map.put("fecha", saved.getFecha().toString());
            map.put("horaInicio", saved.getHoraInicio().toString());
            map.put("horaFin", saved.getHoraFin().toString());
            map.put("motivo", saved.getMotivo());
            return map;
        }).toList();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Eliminar bloqueo
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'GESTIONAR_BLOQUEOS'))")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!bloqueoRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bloqueo no encontrado.");
        }
        bloqueoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

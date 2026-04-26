package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.DiaNoLaborable;
import com.estadio.api.canchas.repository.DiaNoLaborableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dias-no-laborables")
@RequiredArgsConstructor
public class DiaNoLaborableController {

    private final DiaNoLaborableRepository repository;

    // Listar días no laborables (desde hoy) — público para que el calendario de reservas los use
    @GetMapping
    public ResponseEntity<List<DiaNoLaborable>> listar() {
        return ResponseEntity.ok(repository.findByFechaGreaterThanEqualOrderByFechaAsc(LocalDate.now()));
    }

    // Crear día no laborable
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiaNoLaborable> crear(@RequestBody Map<String, String> body) {
        String fechaStr = body.get("fecha");
        String motivo = body.get("motivo");

        if (fechaStr == null || fechaStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha es obligatoria.");
        }

        LocalDate fecha = LocalDate.parse(fechaStr);

        if (repository.existsByFecha(fecha)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esa fecha ya esta marcada como no laborable.");
        }

        if (motivo != null && motivo.trim().length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El motivo no puede superar los 200 caracteres.");
        }

        DiaNoLaborable dia = new DiaNoLaborable();
        dia.setFecha(fecha);
        dia.setMotivo(motivo != null && !motivo.isBlank() ? motivo.trim() : "Cerrado");

        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(dia));
    }

    // Eliminar día no laborable
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dia no laborable no encontrado.");
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

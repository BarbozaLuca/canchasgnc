package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.Cancha;
import com.estadio.api.canchas.model.Descuento;
import com.estadio.api.canchas.repository.DescuentoRepository;
import com.estadio.api.canchas.service.ICanchaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/descuentos")
@RequiredArgsConstructor
public class DescuentoController {

    private final DescuentoRepository descuentoRepository;
    private final ICanchaService canchaService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<Descuento>> getAll() {
        return ResponseEntity.ok(descuentoRepository.findAllByOrderByFechaAscHoraInicioAsc());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'GESTIONAR_DESCUENTOS'))")
    public ResponseEntity<Descuento> crear(@RequestBody Map<String, Object> body) {
        Long canchaId = Long.valueOf(body.get("canchaId").toString());
        LocalDate fecha = LocalDate.parse(body.get("fecha").toString());
        LocalTime horaInicio = LocalTime.parse(body.get("horaInicio").toString());
        Integer porcentaje = Integer.valueOf(body.get("porcentaje").toString());

        if (porcentaje < 1 || porcentaje > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El porcentaje debe estar entre 1 y 100");
        }

        Cancha cancha = canchaService.findById(canchaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cancha no encontrada"));

        // Si ya existe un descuento para ese slot, lo reemplaza
        descuentoRepository.findByCanchaIdAndFechaAndHoraInicio(canchaId, fecha, horaInicio)
                .ifPresent(descuentoRepository::delete);

        Descuento descuento = new Descuento();
        descuento.setCancha(cancha);
        descuento.setFecha(fecha);
        descuento.setHoraInicio(horaInicio);
        descuento.setPorcentaje(porcentaje);

        return ResponseEntity.status(HttpStatus.CREATED).body(descuentoRepository.save(descuento));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'GESTIONAR_DESCUENTOS'))")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!descuentoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        descuentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

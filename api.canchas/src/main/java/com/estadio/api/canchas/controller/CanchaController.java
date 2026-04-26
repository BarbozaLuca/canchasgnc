package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.Cancha;
import com.estadio.api.canchas.service.ICanchaService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/canchas")
@RequiredArgsConstructor
public class CanchaController {

    private final ICanchaService canchaService;

    @Value("${uploads.path}")
    private String uploadsPath;

    // Endpoint público: cualquier visitante puede ver las canchas disponibles
    @GetMapping
    public ResponseEntity<List<Cancha>> getActivas() {
        return ResponseEntity.ok(canchaService.findActivas());
    }

    // Admin y staff ven todas, incluidas las que están en mantenimiento
    @GetMapping("/todas")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<Cancha>> getAll() {
        return ResponseEntity.ok(canchaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cancha> getById(@PathVariable Long id) {
        return canchaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Cancha> create(@Valid @RequestBody Cancha cancha) {
        // El estado activa siempre arranca en true, el cliente no lo decide
        cancha.setActiva(true);
        if (cancha.getNombre() != null) cancha.setNombre(cancha.getNombre().trim());
        if (cancha.getDescripcion() != null) cancha.setDescripcion(cancha.getDescripcion().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(canchaService.save(cancha));
    }

    @PatchMapping("/editar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Cancha> update(@PathVariable Long id, @RequestBody Cancha body) {
        return canchaService.findById(id)
                .map(existente -> {
                    if (body.getNombre() != null) existente.setNombre(body.getNombre().trim());
                    if (body.getDescripcion() != null) existente.setDescripcion(body.getDescripcion().trim());
                    if (body.getPrecioHora() != null) existente.setPrecioHora(body.getPrecioHora());
                    if (body.getTipo() != null) existente.setTipo(body.getTipo());
                    if (body.getImagenUrl() != null) existente.setImagenUrl(body.getImagenUrl());
                    return ResponseEntity.ok(canchaService.save(existente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Soft Delete: pone la cancha en mantenimiento sin borrar su historial
    @PatchMapping("/desactivar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Cancha> desactivar(@PathVariable Long id) {
        if (canchaService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(canchaService.desactivar(id));
    }

    // Subir imagen de cancha
    @PostMapping("/imagen/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImagen(
            @PathVariable Long id,
            @RequestParam("imagen") MultipartFile file) {

        Cancha cancha = canchaService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cancha no encontrada"));

        // Validar tipo de archivo
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten archivos de imagen");
        }

        try {
            // Crear directorio si no existe
            Path uploadDir = Paths.get(uploadsPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Generar nombre único
            String extension = ".jpg";
            if (file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")) {
                extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")).toLowerCase();
            }
            if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten imágenes JPG, PNG o WebP.");
            }
            String filename = "cancha_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

            // Guardar archivo
            Path filePath = uploadDir.resolve(filename);
            Files.write(filePath, file.getBytes());

            // Borrar imagen anterior si era local
            String oldUrl = cancha.getImagenUrl();
            if (oldUrl != null && oldUrl.startsWith("/api/canchas/imagen/archivo/")) {
                String oldFilename = oldUrl.substring(oldUrl.lastIndexOf("/") + 1);
                Path oldPath = uploadDir.resolve(oldFilename);
                Files.deleteIfExists(oldPath);
            }

            // Guardar URL relativa en la BD
            String url = "/api/canchas/imagen/archivo/" + filename;
            cancha.setImagenUrl(url);
            canchaService.save(cancha);

            return ResponseEntity.ok(Map.of("imagen_url", url));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la imagen");
        }
    }

    // Servir imagenes subidas
    @GetMapping("/imagen/archivo/{filename}")
    public ResponseEntity<byte[]> getImagen(@PathVariable String filename) {
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Path filePath = Paths.get(uploadsPath).resolve(filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            byte[] bytes = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "image/jpeg";
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "public, max-age=86400")
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/eliminar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        if (canchaService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        canchaService.deleteById(id);
        return ResponseEntity.ok("Cancha eliminada correctamente.");
    }
}

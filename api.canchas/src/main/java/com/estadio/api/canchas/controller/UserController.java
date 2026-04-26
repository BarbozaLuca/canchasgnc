package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.dto.StaffPermissionsDTO;
import com.estadio.api.canchas.dto.UserCreateDTO;
import com.estadio.api.canchas.dto.UserDTO;
import com.estadio.api.canchas.model.Rol;
import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.service.IRolService;
import com.estadio.api.canchas.service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;
    private final IRolService rolService;

    @PostMapping("/crear")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> create(@Valid @RequestBody UserCreateDTO dto) {

        if (userService.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email.");
        }

        Rol rol = rolService.findById(dto.getRolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol indicado no existe."));

        User user = new User();
        user.setNombre(dto.getNombre());
        user.setEmail(dto.getEmail());
        user.setPassword(userService.encriptPassword(dto.getPassword()));
        user.setRol(rol);
        user.setEnabled(true);
        user.setAccountNoExpired(true);
        user.setAccountNoLocked(true);
        user.setCredentialNoExpired(true);

        User nuevo = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(nuevo));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<UserDTO>> getAll() {
        List<UserDTO> usuarios = userService.findAll().stream()
                .map(this::convertToDto).toList();
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {
        return userService.findById(id)
                .map(u -> ResponseEntity.ok(convertToDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Bloquear/desbloquear un usuario (ej: cliente que no paga, empleado que renuncia)
    @PatchMapping("/desactivar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> desactivar(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        user.setEnabled(!user.isEnabled());
        return ResponseEntity.ok(convertToDto(userService.save(user)));
    }

    // Cambiar el rol de un usuario (ej: promover un cliente a staff)
    @PatchMapping("/cambiar-rol/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> cambiarRol(@PathVariable Long id, @RequestParam Long rolId) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        Rol rol = rolService.findById(rolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol indicado no existe."));

        user.setRol(rol);
        return ResponseEntity.ok(convertToDto(userService.save(user)));
    }

    // Actualizar permisos granulares de un staff
    @PatchMapping("/permisos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> actualizarPermisos(@PathVariable Long id, @RequestBody StaffPermissionsDTO dto) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        user.setPuedeVerReservas(dto.isPuedeVerReservas());
        user.setPuedeCrearReservas(dto.isPuedeCrearReservas());
        user.setPuedeCambiarEstado(dto.isPuedeCambiarEstado());
        user.setPuedeGestionarBloqueos(dto.isPuedeGestionarBloqueos());
        user.setPuedeGestionarTurnosFijos(dto.isPuedeGestionarTurnosFijos());

        return ResponseEntity.ok(convertToDto(userService.save(user)));
    }

    // Permite que el propio usuario (incluido staff) consulte su perfil con permisos
    @GetMapping("/yo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .map(u -> ResponseEntity.ok(convertToDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        if (userService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteById(id);
        return ResponseEntity.ok("Usuario eliminado correctamente.");
    }

    private UserDTO convertToDto(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setNombre(user.getNombre());
        dto.setEmail(user.getEmail());
        dto.setEnabled(user.isEnabled());
        dto.setRolId(user.getRol() != null ? user.getRol().getId() : null);
        dto.setRolNombre(user.getRol() != null ? user.getRol().getRolName() : null);
        dto.setPuedeVerReservas(user.isPuedeVerReservas());
        dto.setPuedeCrearReservas(user.isPuedeCrearReservas());
        dto.setPuedeCambiarEstado(user.isPuedeCambiarEstado());
        dto.setPuedeGestionarBloqueos(user.isPuedeGestionarBloqueos());
        dto.setPuedeGestionarTurnosFijos(user.isPuedeGestionarTurnosFijos());
        return dto;
    }
}

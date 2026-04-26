package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class ProfileController {

    private final IUserService userService;

    // Obtener perfil del usuario autenticado
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getPerfil(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "nombre", user.getNombre(),
                "email", user.getEmail(),
                "celular", user.getCelular() != null ? user.getCelular() : "",
                "rol", user.getRol().getRolName()
        ));
    }

    // Actualizar nombre y celular
    @PatchMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updatePerfil(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        User user = getUser(userDetails);

        String nombre = body.get("nombre");
        String celular = body.get("celular");

        if (nombre != null && !nombre.isBlank()) {
            if (nombre.trim().length() > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre no puede superar los 100 caracteres.");
            }
            user.setNombre(nombre.trim());
        }

        if (celular != null) {
            if (celular.trim().length() > 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El celular no puede superar los 20 caracteres.");
            }
            user.setCelular(celular.trim().isEmpty() ? null : celular.trim());
        }

        userService.save(user);

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "nombre", user.getNombre(),
                "email", user.getEmail(),
                "celular", user.getCelular() != null ? user.getCelular() : "",
                "rol", user.getRol().getRolName(),
                "message", "Perfil actualizado"
        ));
    }

    // Cambiar email (verifica que no exista otro usuario con ese email)
    @PatchMapping("/email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> updateEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        User user = getUser(userDetails);
        String nuevoEmail = body.get("email");

        if (nuevoEmail == null || nuevoEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email es obligatorio.");
        }

        nuevoEmail = nuevoEmail.trim().toLowerCase();

        if (nuevoEmail.equals(user.getEmail())) {
            return ResponseEntity.ok(Map.of("message", "El email es el mismo."));
        }
 
        if (userService.existsByEmail(nuevoEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email.");
        }

        user.setEmail(nuevoEmail);
        userService.save(user);

        return ResponseEntity.ok(Map.of("message", "Email actualizado. Vuelve a iniciar sesion."));
    }

    // Cambiar contrasena (requiere contrasena actual)
    @PatchMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> updatePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        User user = getUser(userDetails);
        String actual = body.get("passwordActual");
        String nueva = body.get("passwordNueva");

        if (actual == null || actual.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contrasena actual es obligatoria.");
        }
        if (nueva == null || nueva.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contrasena debe tener al menos 6 caracteres.");
        }

        // Verificar contrasena actual
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder bcrypt =
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        if (!bcrypt.matches(actual, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La contrasena actual es incorrecta.");
        }

        user.setPassword(userService.encriptPassword(nueva));
        userService.save(user);

        return ResponseEntity.ok(Map.of("message", "Contrasena actualizada correctamente."));
    }

    private User getUser(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));
    }
}

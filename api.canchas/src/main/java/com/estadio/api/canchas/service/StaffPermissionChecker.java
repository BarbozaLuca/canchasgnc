package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Verifica los permisos granulares de usuarios con rol STAFF.
 * Los admin siempre tienen acceso total.
 * Se usa en @PreAuthorize con la expresión: @staffPermissionChecker.check(authentication, 'PERMISO')
 */
@Service("staffPermissionChecker")
@RequiredArgsConstructor
public class StaffPermissionChecker {

    private final UserRepository userRepository;

    public boolean check(Authentication auth, String permiso) {
        // Admin siempre puede
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return true;
        }
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) return false;

        return switch (permiso) {
            case "VER_RESERVAS"        -> user.isPuedeVerReservas();
            case "CREAR_RESERVAS"      -> user.isPuedeCrearReservas();
            case "CAMBIAR_ESTADO"      -> user.isPuedeCambiarEstado();
            case "GESTIONAR_BLOQUEOS"  -> user.isPuedeGestionarBloqueos();
            case "GESTIONAR_TURNOS"    -> user.isPuedeGestionarTurnosFijos();
            default -> false;
        };
    }
}

package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.dto.NotificacionDTO;
import com.estadio.api.canchas.model.Notificacion;
import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.repository.NotificacionRepository;
import com.estadio.api.canchas.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionRepository notificacionRepository;
    private final IUserService userService;

    // Cantidad de notificaciones no leidas
    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Integer>> getCount(@AuthenticationPrincipal UserDetails userDetails) {
        User usuario = getUsuario(userDetails);
        int count = notificacionRepository.countByUsuarioIdAndLeidaFalse(usuario.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    // Lista de notificaciones del usuario (ultimas 50)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificacionDTO>> getNotificaciones(@AuthenticationPrincipal UserDetails userDetails) {
        User usuario = getUsuario(userDetails);
        List<NotificacionDTO> notifs = notificacionRepository
                .findByUsuarioIdOrderByCreatedAtDesc(usuario.getId())
                .stream()
                .limit(50)
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(notifs);
    }

    // Marcar una notificacion como leida
    @PatchMapping("/leer/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> marcarLeida(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User usuario = getUsuario(userDetails);
        Notificacion notif = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificacion no encontrada"));
        if (!notif.getUsuario().getId().equals(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No es tu notificacion");
        }
        notif.setLeida(true);
        notificacionRepository.save(notif);
        return ResponseEntity.ok(Map.of("message", "Marcada como leida"));
    }

    // Marcar todas como leidas
    @PatchMapping("/leer-todas")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, String>> marcarTodasLeidas(@AuthenticationPrincipal UserDetails userDetails) {
        User usuario = getUsuario(userDetails);
        notificacionRepository.marcarTodasLeidas(usuario.getId());
        return ResponseEntity.ok(Map.of("message", "Todas marcadas como leidas"));
    }

    private User getUsuario(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private NotificacionDTO toDto(Notificacion n) {
        NotificacionDTO dto = new NotificacionDTO();
        dto.setId(n.getId());
        dto.setTipo(n.getTipo());
        dto.setMensaje(n.getMensaje());
        dto.setLeida(n.isLeida());
        dto.setCreatedAt(n.getCreatedAt());
        dto.setReservaId(n.getReserva() != null ? n.getReserva().getId() : null);
        return dto;
    }
}

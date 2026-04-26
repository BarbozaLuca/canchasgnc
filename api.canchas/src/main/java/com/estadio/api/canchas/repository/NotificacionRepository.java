package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    long deleteByCreatedAtBefore(LocalDateTime fecha);

    // Contar notificaciones no leidas del usuario
    int countByUsuarioIdAndLeidaFalse(Long usuarioId);

    // Obtener las ultimas notificaciones del usuario (ordenadas por fecha desc)
    List<Notificacion> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);

    // Marcar todas como leidas para un usuario
    @Modifying
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.usuario.id = :usuarioId AND n.leida = false")
    void marcarTodasLeidas(@Param("usuarioId") Long usuarioId);
}

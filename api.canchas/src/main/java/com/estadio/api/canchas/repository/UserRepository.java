package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Usado por Spring Security para autenticar al usuario por email
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Buscar usuarios por nombre de rol (ej: "ROLE_STAFF", "ROLE_ADMIN")
    List<User> findByRol_RolNameAndEnabledTrue(String rolName);
}

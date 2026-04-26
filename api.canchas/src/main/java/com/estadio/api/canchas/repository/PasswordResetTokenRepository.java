package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByEmailAndCodigoAndUsadoFalse(String email, String codigo);

    void deleteByEmail(String email);

    long deleteByExpiracionBefore(LocalDateTime fecha);
}

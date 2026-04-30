package com.estadio.api.canchas.config;

import com.estadio.api.canchas.repository.EmailVerificationTokenRepository;
import com.estadio.api.canchas.repository.NotificacionRepository;
import com.estadio.api.canchas.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Limpieza programada de datos obsoletos:
 * - Tokens de verificacion de email vencidos
 * - Tokens de recuperacion de password vencidos
 * - Notificaciones de mas de 3 dias
 */
@Component
@RequiredArgsConstructor
public class TokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificacionRepository notificacionRepository;

    // Se ejecuta cada 24 horas
    @Scheduled(fixedRate = 86_400_000L) // 24 h en ms
    @Transactional
    public void limpiarDatosObsoletos() {
        LocalDateTime ahora = LocalDateTime.now();

        long verificacion = emailVerificationTokenRepository.deleteByExpiracionBefore(ahora);
        long reset = passwordResetTokenRepository.deleteByExpiracionBefore(ahora);
        long notificaciones = notificacionRepository.deleteByCreatedAtBefore(ahora.minusDays(3));

        if (verificacion > 0 || reset > 0 || notificaciones > 0) {
            log.info("Limpieza diaria: {} tokens verificacion + {} tokens reset + {} notificaciones eliminados",
                    verificacion, reset, notificaciones);
        }
    }
}

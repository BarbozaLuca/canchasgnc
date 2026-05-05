package com.estadio.api.canchas.config;

import com.estadio.api.canchas.repository.EmailVerificationTokenRepository;
import com.estadio.api.canchas.repository.NotificacionRepository;
import com.estadio.api.canchas.repository.PasswordResetTokenRepository;
import com.estadio.api.canchas.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Limpieza programada de datos obsoletos:
 * - Tokens de verificacion de email vencidos
 * - Tokens de recuperacion de password vencidos
 * - Notificaciones de mas de 2 dias
 */
@Component
@RequiredArgsConstructor
public class TokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificacionRepository notificacionRepository;
    private final ReservaRepository reservaRepository;

    // Se ejecuta cada 24 horas
    @Scheduled(fixedRate = 86_400_000L) // 24 h en ms
    @Transactional
    public void limpiarDatosObsoletos() {
        LocalDateTime ahora = LocalDateTime.now();

        long verificacion = emailVerificationTokenRepository.deleteByExpiracionBefore(ahora);
        long reset = passwordResetTokenRepository.deleteByExpiracionBefore(ahora);
        long notificaciones = notificacionRepository.deleteByCreatedAtBefore(ahora.minusDays(2));

        if (verificacion > 0 || reset > 0 || notificaciones > 0) {
            log.info("Limpieza diaria: {} tokens verificacion + {} tokens reset + {} notificaciones eliminados",
                    verificacion, reset, notificaciones);
        }
    }

    // Se ejecuta todos los días a las 04:00
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void eliminarReservasAntiguas() {
        LocalDate fechaLimite = LocalDate.now().minusMonths(1);
        int eliminadas = reservaRepository.deleteByFechaAntesDe(fechaLimite);
        if (eliminadas > 0) {
            log.info("Limpieza mensual: {} reservas anteriores a {} eliminadas", eliminadas, fechaLimite);
        }
    }
}

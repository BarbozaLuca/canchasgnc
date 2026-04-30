package com.estadio.api.canchas.config;

import com.estadio.api.canchas.service.IReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservaScheduler {

    private final IReservaService reservaService;

    // Se ejecuta cada 1 minuto — cancela reservas PENDIENTES que pasaron el límite de pago
    @Scheduled(fixedRate = 60000) // 1 min = 60.000 ms
    public void cancelarReservasVencidas() {
        reservaService.cancelarReservasVencidas();
    }

    // Se ejecuta cada 10 minutos — envía recordatorio 1h antes del turno
    @Scheduled(fixedRate = 600000) // 10 min = 600.000 ms
    public void enviarRecordatorios() {
        reservaService.enviarRecordatorios();
    }

    // Se ejecuta una vez al día a las 03:00 — genera reservas de turnos fijos para la semana
    @Scheduled(cron = "0 0 3 * * *")
    public void generarTurnosFijos() {
        reservaService.generarReservasDeTurnosFijos();
    }

}

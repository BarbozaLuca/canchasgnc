package com.estadio.api.canchas.model;

public enum EstadoReserva {

    PENDIENTE,    // Reserva creada, aún no se cobró
    CONFIRMADA,   // Pago recibido / seña registrada
    CANCELADA,    // Anulada (por el cliente o el admin)
    COMPLETADA    // El turno ya se jugó (útil para historial e informes)

}

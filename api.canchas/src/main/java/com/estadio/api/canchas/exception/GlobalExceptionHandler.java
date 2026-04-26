package com.estadio.api.canchas.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Credenciales incorrectas → 401
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        Map<String, String> error = new LinkedHashMap<>();
        error.put("error", "Email o contraseña incorrectos.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // Sin permisos → 403
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AuthorizationDeniedException ex) {
        Map<String, String> error = new LinkedHashMap<>();
        error.put("error", "No tiene permisos para realizar esta acción.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    // Errores de validación (@Valid) → 400 con detalle por campo
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errores);
    }

    // Errores de negocio lanzados con ResponseStatusException (ej: horario ocupado, cancha inactiva)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        Map<String, String> error = new LinkedHashMap<>();
        error.put("error", ex.getReason());
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    // Conflicto de serialización (dos reservas simultáneas al mismo horario) → 409
    @ExceptionHandler(CannotAcquireLockException.class)
    public ResponseEntity<Map<String, String>> handleSerializationFailure(CannotAcquireLockException ex) {
        log.warn("Conflicto de concurrencia al crear reserva: {}", ex.getMessage());
        Map<String, String> error = new LinkedHashMap<>();
        error.put("error", "El horario fue reservado al mismo tiempo por otro usuario. Por favor selecciona otro.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // Cualquier otro error inesperado → 500 (sin exponer detalles internos al cliente)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        log.error("Error inesperado: {}", ex.getMessage(), ex);
        Map<String, String> error = new LinkedHashMap<>();
        error.put("error", "Ocurrio un error inesperado. Intenta de nuevo mas tarde.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.dto.FacturacionDTO;
import com.estadio.api.canchas.dto.DisponibilidadResponseDTO;
import com.estadio.api.canchas.dto.HorarioSlotDTO;
import com.estadio.api.canchas.dto.ReservaRequestDTO;
import com.estadio.api.canchas.dto.ReservaResponseDTO;
import com.estadio.api.canchas.model.BloqueoHorario;
import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.model.EstadoReserva;
import com.estadio.api.canchas.model.Reserva;
import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.repository.BloqueoHorarioRepository;
import com.estadio.api.canchas.repository.DiaNoLaborableRepository;
import com.estadio.api.canchas.repository.TurnoFijoRepository;
import com.estadio.api.canchas.service.ConfigPagoService;
import com.estadio.api.canchas.service.IReservaService;
import com.estadio.api.canchas.service.IUserService;
import com.estadio.api.canchas.service.MercadoPagoService;
import com.mercadopago.resources.preference.Preference;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final IReservaService reservaService;
    private final IUserService userService;
    private final ConfigPagoService configPagoService;
    private final MercadoPagoService mercadoPagoService;
    private final BloqueoHorarioRepository bloqueoHorarioRepository;
    private final DiaNoLaborableRepository diaNoLaborableRepository;
    private final TurnoFijoRepository turnoFijoRepository;

    @Value("${pago.limite.minutos}")
    private int limiteMinutos;


    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'VER_RESERVAS'))")
    public ResponseEntity<List<ReservaResponseDTO>> getAll() {
        List<ReservaResponseDTO> reservas = reservaService.findAll().stream()
                .map(this::convertToDto).toList();
        return ResponseEntity.ok(reservas);
    }

    // Reservas del usuario autenticado (para la página "Mis reservas")
    @GetMapping("/mis-reservas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ReservaResponseDTO>> getMisReservas(@AuthenticationPrincipal UserDetails userDetails) {
        User usuario = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));
        List<ReservaResponseDTO> reservas = reservaService.findByUsuarioId(usuario.getId()).stream()
                .map(this::convertToDto).toList();
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ReservaResponseDTO> getById(@PathVariable Long id) {
        return reservaService.findById(id)
                .map(r -> ResponseEntity.ok(convertToDto(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Historial de reservas de un usuario específico
    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<ReservaResponseDTO>> getByUsuario(@PathVariable Long usuarioId) {
        List<ReservaResponseDTO> reservas = reservaService.findByUsuarioId(usuarioId).stream()
                .map(this::convertToDto).toList();
        return ResponseEntity.ok(reservas);
    }

    // Disponibilidad: devuelve todos los slots horarios con su estado (disponible/ocupado)
    @GetMapping("/disponibilidad/{canchaId}")
    public ResponseEntity<DisponibilidadResponseDTO> getDisponibilidad(
            @PathVariable Long canchaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        // Generar slots dinámicos desde la config
        LocalTime[][] slots = configPagoService.generarSlots();

        // Si es día no laborable, devolver todos los slots como no disponibles
        boolean esDiaNoLaborable = diaNoLaborableRepository.existsByFecha(fecha);
        if (esDiaNoLaborable) {
            List<HorarioSlotDTO> horarios = new ArrayList<>();
            for (LocalTime[] slot : slots) {
                horarios.add(new HorarioSlotDTO(slot[0].toString(), slot[1].toString(), false));
            }
            return ResponseEntity.ok(new DisponibilidadResponseDTO(horarios));
        }

        // Obtener reservas activas (no canceladas) para esa cancha y fecha
        List<Reserva> reservasActivas = reservaService.findByCanchaIdAndFecha(canchaId, fecha).stream()
                .filter(r -> r.getEstado() != EstadoReserva.CANCELADA)
                .toList();

        // Crear set de horas ocupadas para búsqueda rápida
        Set<LocalTime> horasOcupadas = reservasActivas.stream()
                .map(Reserva::getHoraInicio)
                .collect(Collectors.toSet());

        // Agregar horas bloqueadas por el admin
        List<BloqueoHorario> bloqueos = bloqueoHorarioRepository.findByCanchaIdAndFecha(canchaId, fecha);
        Set<LocalTime> horasBloqueadas = bloqueos.stream()
                .map(BloqueoHorario::getHoraInicio)
                .collect(Collectors.toSet());

        // Agregar horas de turnos fijos (reservas recurrentes vigentes)
        Set<LocalTime> horasTurnoFijo = turnoFijoRepository
                .findVigentesByCanchaAndDia(canchaId, fecha.getDayOfWeek(), fecha)
                .stream()
                .map(com.estadio.api.canchas.model.TurnoFijo::getHoraInicio)
                .collect(Collectors.toSet());

        boolean esHoy = fecha.equals(LocalDate.now());
        LocalTime ahora = LocalTime.now();
        // horaApertura sirve para detectar slots post-medianoche (ej: 00:00, 01:00 en un
        // horario 17:00→01:00). Esos slots pertenecen al día siguiente y no deben bloquearse
        // por la hora actual del día de hoy.
        LocalTime horaApertura = slots.length > 0 ? slots[0][0] : LocalTime.MIDNIGHT;

        List<HorarioSlotDTO> horarios = new ArrayList<>();
        for (LocalTime[] slot : slots) {
            boolean esSlotPostMedianoche = slot[0].isBefore(horaApertura);
            boolean ocupado = horasOcupadas.contains(slot[0])
                    || horasBloqueadas.contains(slot[0])
                    || horasTurnoFijo.contains(slot[0])
                    || (esHoy && !esSlotPostMedianoche && !slot[0].isAfter(ahora)); // turnos pasados hoy (excluye post-medianoche)
            horarios.add(new HorarioSlotDTO(slot[0].toString(), slot[1].toString(), !ocupado));
        }

        return ResponseEntity.ok(new DisponibilidadResponseDTO(horarios));
    }

    // Estadísticas de facturación para el panel admin
    @GetMapping("/facturacion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacturacionDTO> getFacturacion() {
        return ResponseEntity.ok(reservaService.getFacturacion());
    }

    // Exportar facturación a Excel (.xlsx)
    @GetMapping("/facturacion/exportar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportarFacturacion(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        List<Reserva> reservas = reservaService.findAll().stream()
                .filter(r -> r.getEstado() != EstadoReserva.PENDIENTE)
                .filter(r -> !r.getFecha().isBefore(desde) && !r.getFecha().isAfter(hasta))
                .sorted((a, b) -> {
                    int cmp = a.getFecha().compareTo(b.getFecha());
                    return cmp != 0 ? cmp : a.getHoraInicio().compareTo(b.getHoraInicio());
                })
                .toList();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Facturacion");

            // Estilo header
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row
            String[] columnas = {"Fecha", "Cancha", "Usuario", "Email", "Horario", "Precio Total", "Seña", "Estado"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columnas.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columnas[i]);
                cell.setCellStyle(headerStyle);
            }

            // Estilo moneda
            CellStyle moneyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            moneyStyle.setDataFormat(format.getFormat("$#,##0.00"));

            // Data rows
            int rowNum = 1;
            for (Reserva r : reservas) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(r.getFecha().toString());
                row.createCell(1).setCellValue(r.getCancha().getNombre());
                row.createCell(2).setCellValue(r.getUsuario().getNombre());
                row.createCell(3).setCellValue(r.getUsuario().getEmail());
                row.createCell(4).setCellValue(r.getHoraInicio() + " - " + r.getHoraFin());

                Cell precioCell = row.createCell(5);
                precioCell.setCellValue(r.getPrecioTotal().doubleValue());
                precioCell.setCellStyle(moneyStyle);

                Cell senaCell = row.createCell(6);
                senaCell.setCellValue(r.getSena().doubleValue());
                senaCell.setCellStyle(moneyStyle);

                row.createCell(7).setCellValue(r.getEstado().name());
            }

            // Fila de totales
            Row totalRow = sheet.createRow(rowNum + 1);
            Cell totalLabel = totalRow.createCell(4);
            totalLabel.setCellValue("TOTAL");
            totalLabel.setCellStyle(headerStyle);

            double totalPrecio = reservas.stream()
                    .filter(r -> r.getEstado() == EstadoReserva.CONFIRMADA || r.getEstado() == EstadoReserva.COMPLETADA)
                    .mapToDouble(r -> r.getPrecioTotal().doubleValue()).sum();
            Cell totalCell = totalRow.createCell(5);
            totalCell.setCellValue(totalPrecio);
            totalCell.setCellStyle(moneyStyle);

            // Auto-size columnas
            for (int i = 0; i < columnas.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);

            String filename = "facturacion_" + desde + "_a_" + hasta + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(out.toByteArray());

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al generar el archivo Excel");
        }
    }

    // Cualquier usuario autenticado puede crear una reserva
    @PostMapping("/crear")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReservaResponseDTO> crear(
            @Valid @RequestBody ReservaRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Obtener el usuario del token JWT (no del body)
        User usuario = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        dto.setUsuarioId(usuario.getId());

        Reserva reserva = reservaService.crear(dto);

        // Generar link de pago de Mercado Pago
        try {
            Preference preference = mercadoPagoService.crearPreferencia(reserva);
            reserva.setMpPreferenceId(preference.getId());
            reservaService.save(reserva);

            ReservaResponseDTO responseDto = convertToDto(reserva);
            responseDto.setMpInitPoint(preference.getInitPoint());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (Exception e) {
            // Log del error real para diagnóstico
            System.err.println("ERROR Mercado Pago: " + e.getMessage());
            e.printStackTrace();
            ReservaResponseDTO responseDto = convertToDto(reserva);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        }
    }

    // Staff o admin crean una reserva presencial directamente como CONFIRMADA (sin MP)
    @PostMapping("/crear-admin")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'CREAR_RESERVAS'))")
    public ResponseEntity<ReservaResponseDTO> crearAdmin(
            @Valid @RequestBody ReservaRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        User staff = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        dto.setUsuarioId(staff.getId());

        Reserva reserva = reservaService.crear(dto);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        if (dto.getNombrePresencial() != null && !dto.getNombrePresencial().isBlank()) {
            reserva.setNombrePresencial(dto.getNombrePresencial().trim());
        }
        reservaService.save(reserva);

        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(reserva));
    }

    // Regenerar link de pago MP cuando la preferencia expiró
    @PostMapping("/mp-link/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> regenerarLinkMP(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Reserva reserva = reservaService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        // Solo el dueño de la reserva puede regenerar el link
        if (!reserva.getUsuario().getEmail().equals(userDetails.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No autorizado");
        }

        // Solo para reservas pendientes sin pago
        if (reserva.getEstado() != EstadoReserva.PENDIENTE) {
            return ResponseEntity.badRequest().body("La reserva ya no está pendiente de pago");
        }

        try {
            Preference preference = mercadoPagoService.crearPreferencia(reserva);
            reserva.setMpPreferenceId(preference.getId());
            reservaService.save(reserva);

            ReservaResponseDTO dto = convertToDto(reserva);
            dto.setMpInitPoint(preference.getInitPoint());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("ERROR regenerar MP link: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al generar link de pago: " + e.getMessage());
        }
    }

    // El cliente cancela su propia reserva o el admin/staff cancela cualquiera
    @PatchMapping("/cancelar/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReservaResponseDTO> cancelar(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Reserva reserva = reservaService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada."));

        User solicitante = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));

        String rol = solicitante.getRol().getRolName();
        boolean esAdminOStaff = rol.equals("ROLE_ADMIN") || rol.equals("ROLE_STAFF");
        boolean esPropietario = reserva.getUsuario().getId().equals(solicitante.getId());

        if (!esAdminOStaff && !esPropietario) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tenes permiso para cancelar esta reserva.");
        }

        return ResponseEntity.ok(convertToDto(reservaService.cancelar(id)));
    }

    // Solo staff o admin pueden cambiar el estado manualmente
    @PatchMapping("/estado/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('STAFF') and @staffPermissionChecker.check(authentication,'CAMBIAR_ESTADO'))")
    public ResponseEntity<ReservaResponseDTO> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoReserva estado) {
        if (reservaService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(convertToDto(reservaService.cambiarEstado(id, estado)));
    }

    private ReservaResponseDTO convertToDto(Reserva r) {
        ReservaResponseDTO dto = new ReservaResponseDTO();
        dto.setId(r.getId());
        dto.setFecha(r.getFecha());
        dto.setHoraInicio(r.getHoraInicio());
        dto.setHoraFin(r.getHoraFin());
        dto.setPrecioTotal(r.getPrecioTotal());
        dto.setSena(r.getSena());
        dto.setEstado(r.getEstado().name());
        dto.setComprobante(r.getComprobante());
        dto.setComprobanteUrl(r.getComprobanteUrl());
        dto.setMpPaymentId(r.getMpPaymentId());
        dto.setUsuarioId(r.getUsuario().getId());
        dto.setUsuarioNombre(r.getUsuario().getNombre());
        dto.setUsuarioEmail(r.getUsuario().getEmail());
        dto.setCanchaId(r.getCancha().getId());
        dto.setCanchaNombre(r.getCancha().getNombre());
        dto.setNombrePresencial(r.getNombrePresencial());

        // Solo muestra info de pago si la reserva está pendiente
        if (r.getEstado() == EstadoReserva.PENDIENTE) {
            ConfigPago configPago = configPagoService.getConfig();
            dto.setAliasPago(configPago.getAlias());
            dto.setTitularPago(configPago.getTitular());
            dto.setMensajePago("Transferí $" + r.getSena() + " al alias " + configPago.getAlias()
                    + " (" + configPago.getTitular() + ") e ingresá el nombre de la cuenta desde donde transferiste. Tenés "
                    + limiteMinutos + " minutos.");
            // expiresAt = fechaCreacion + limiteMinutos (para el countdown del frontend)
            if (r.getFechaCreacion() != null) {
                dto.setExpiresAt(r.getFechaCreacion().plusMinutes(limiteMinutos));
            }
        }

        return dto;
    }
}

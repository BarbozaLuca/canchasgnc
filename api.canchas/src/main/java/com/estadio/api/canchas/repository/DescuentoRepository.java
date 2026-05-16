package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.Descuento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface DescuentoRepository extends JpaRepository<Descuento, Long> {

    List<Descuento> findByCanchaIdAndFecha(Long canchaId, LocalDate fecha);

    Optional<Descuento> findByCanchaIdAndFechaAndHoraInicio(Long canchaId, LocalDate fecha, LocalTime horaInicio);

    List<Descuento> findAllByOrderByFechaAscHoraInicioAsc();
}


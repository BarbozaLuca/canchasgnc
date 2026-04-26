package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.BloqueoHorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BloqueoHorarioRepository extends JpaRepository<BloqueoHorario, Long> {

    List<BloqueoHorario> findByCanchaIdAndFecha(Long canchaId, LocalDate fecha);

    List<BloqueoHorario> findByCanchaId(Long canchaId);

    // Todos los bloqueos de hoy en adelante
    List<BloqueoHorario> findByFechaGreaterThanEqualOrderByFechaAscHoraInicioAsc(LocalDate fecha);
}

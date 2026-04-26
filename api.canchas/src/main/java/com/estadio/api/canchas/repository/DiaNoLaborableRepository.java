package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.DiaNoLaborable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DiaNoLaborableRepository extends JpaRepository<DiaNoLaborable, Long> {

    boolean existsByFecha(LocalDate fecha);

    List<DiaNoLaborable> findByFechaGreaterThanEqualOrderByFechaAsc(LocalDate fecha);
}

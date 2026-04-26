package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.Cancha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanchaRepository extends JpaRepository<Cancha, Long> {

    // Devuelve solo las canchas disponibles (no en mantenimiento)
    List<Cancha> findByActivaTrue();
}

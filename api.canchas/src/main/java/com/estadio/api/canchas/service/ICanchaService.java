package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.Cancha;

import java.util.List;
import java.util.Optional;

public interface ICanchaService {

    List<Cancha> findAll();

    // Solo devuelve las canchas disponibles (activa = true)
    List<Cancha> findActivas();

    Optional<Cancha> findById(Long id);

    Cancha save(Cancha cancha);

    // Soft Delete: marca la cancha como inactiva sin borrar su historial
    Cancha desactivar(Long id);

    void deleteById(Long id);
}

package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.Rol;

import java.util.List;
import java.util.Optional;

public interface IRolService {

    List<Rol> findAll();

    Optional<Rol> findById(Long id);

    Optional<Rol> findByRolName(String rolName);

    Rol save(Rol rol);

    void deleteById(Long id);
}

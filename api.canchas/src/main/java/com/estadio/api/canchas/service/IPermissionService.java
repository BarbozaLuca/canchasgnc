package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.Permission;

import java.util.List;
import java.util.Optional;

public interface IPermissionService {

    List<Permission> findAll();

    Optional<Permission> findById(Long id);

    Optional<Permission> findByPermissionName(String permissionName);

    Permission save(Permission permission);

    void deleteById(Long id);
}

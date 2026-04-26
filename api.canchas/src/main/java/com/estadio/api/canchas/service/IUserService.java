package com.estadio.api.canchas.service;

import com.estadio.api.canchas.model.User;

import java.util.List;
import java.util.Optional;

public interface IUserService {

    List<User> findAll();

    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    User save(User user);

    void deleteById(Long id);

    String encriptPassword(String password);
}

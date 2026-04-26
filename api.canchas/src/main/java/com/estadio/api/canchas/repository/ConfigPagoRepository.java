package com.estadio.api.canchas.repository;

import com.estadio.api.canchas.model.ConfigPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfigPagoRepository extends JpaRepository<ConfigPago, Long> {
}

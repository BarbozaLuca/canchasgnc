package com.estadio.api.canchas.service.impl;

import com.estadio.api.canchas.model.Cancha;
import com.estadio.api.canchas.repository.CanchaRepository;
import com.estadio.api.canchas.service.ICanchaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CanchaServiceImpl implements ICanchaService {

    private final CanchaRepository canchaRepository;

    @Override
    public List<Cancha> findAll() {
        return canchaRepository.findAll();
    }

    @Override
    public List<Cancha> findActivas() {
        return canchaRepository.findByActivaTrue();
    }

    @Override
    public Optional<Cancha> findById(Long id) {
        return canchaRepository.findById(id);
    }

    @Override
    public Cancha save(Cancha cancha) {
        return canchaRepository.save(cancha);
    }

    @Override
    public Cancha desactivar(Long id) {
        Cancha cancha = canchaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada con id: " + id));
        cancha.setActiva(!cancha.getActiva());
        return canchaRepository.save(cancha);
    }

    @Override
    public void deleteById(Long id) {
        canchaRepository.deleteById(id);
    }
}

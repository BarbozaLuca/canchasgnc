package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.model.Permission;
import com.estadio.api.canchas.model.Rol;
import com.estadio.api.canchas.service.IPermissionService;
import com.estadio.api.canchas.service.IRolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RolController {

    private final IRolService rolService;
    private final IPermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Rol>> getAll() {
        return ResponseEntity.ok(rolService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Rol> getById(@PathVariable Long id) {
        return rolService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/crear")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Rol> create(@RequestBody Rol rol) {
        // Solo persiste los permisos que realmente existen en la BD
        Set<Permission> permisosValidos = new HashSet<>();
        for (Permission p : rol.getPermisos()) {
            permissionService.findById(p.getId()).ifPresent(permisosValidos::add);
        }
        rol.setPermisos(permisosValidos);
        return ResponseEntity.ok(rolService.save(rol));
    }

    @PatchMapping("/editar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Rol> update(@PathVariable Long id, @RequestBody Rol body) {
        return rolService.findById(id)
                .map(existente -> {
                    // Actualiza los campos del objeto existente (no reasigna la variable)
                    existente.setRolName(body.getRolName());

                    Set<Permission> permisosValidos = new HashSet<>();
                    for (Permission p : body.getPermisos()) {
                        permissionService.findById(p.getId()).ifPresent(permisosValidos::add);
                    }
                    existente.setPermisos(permisosValidos);
                    return ResponseEntity.ok(rolService.save(existente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/eliminar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        if (rolService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        rolService.deleteById(id);
        return ResponseEntity.ok("Rol eliminado correctamente.");
    }
}

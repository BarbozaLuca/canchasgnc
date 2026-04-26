package com.estadio.api.canchas.config;

import com.estadio.api.canchas.model.Permission;
import com.estadio.api.canchas.model.Rol;
import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.repository.PermissionRepository;
import com.estadio.api.canchas.repository.RolRepository;
import com.estadio.api.canchas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Carga datos iniciales al arrancar la app SI la BD está vacía.
 * Solo se ejecuta una vez — si ya existen roles, no hace nada.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RolRepository rolRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        // Si ya hay roles cargados, no hacemos nada
        if (rolRepository.count() > 0) {
            return;
        }

        System.out.println("========== INICIALIZANDO DATOS BASE ==========");

        // -------- Permisos --------
        Permission read = permissionRepository.save(crearPermiso("READ"));
        Permission create = permissionRepository.save(crearPermiso("CREATE"));
        Permission update = permissionRepository.save(crearPermiso("UPDATE"));
        Permission delete = permissionRepository.save(crearPermiso("DELETE"));

        // -------- Roles --------
        // ROLE_USER: solo puede leer y crear (reservas)
        Rol rolUser = new Rol();
        rolUser.setRolName("ROLE_USER");
        rolUser.setPermisos(Set.of(read, create));
        rolRepository.save(rolUser);

        // ROLE_STAFF: puede leer, crear y actualizar (gestionar reservas)
        Rol rolStaff = new Rol();
        rolStaff.setRolName("ROLE_STAFF");
        rolStaff.setPermisos(Set.of(read, create, update));
        rolRepository.save(rolStaff);

        // ROLE_ADMIN: acceso total
        Rol rolAdmin = new Rol();
        rolAdmin.setRolName("ROLE_ADMIN");
        rolAdmin.setPermisos(Set.of(read, create, update, delete));
        rolRepository.save(rolAdmin);

        // -------- Usuario Admin por defecto --------
        User admin = new User();
        admin.setNombre("Administrador");
        admin.setEmail("admin@canchas.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRol(rolAdmin);
        admin.setEnabled(true);
        admin.setAccountNoExpired(true);
        admin.setAccountNoLocked(true);
        admin.setCredentialNoExpired(true);
        userRepository.save(admin);

        System.out.println("==============================================");
        System.out.println("  Datos iniciales cargados:");
        System.out.println("  - 4 permisos: READ, CREATE, UPDATE, DELETE");
        System.out.println("  - 3 roles: ROLE_USER, ROLE_STAFF, ROLE_ADMIN");
        System.out.println("  - 1 admin: admin@canchas.com / admin123");
        System.out.println("==============================================");
    }

    private Permission crearPermiso(String nombre) {
        Permission p = new Permission();
        p.setPermissionName(nombre);
        return p;
    }
}

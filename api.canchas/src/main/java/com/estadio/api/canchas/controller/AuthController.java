package com.estadio.api.canchas.controller;

import com.estadio.api.canchas.dto.AuthRequestDTO;
import com.estadio.api.canchas.dto.AuthResponseDTO;
import com.estadio.api.canchas.dto.RegisterRequestDTO;
import com.estadio.api.canchas.model.ConfigPago;
import com.estadio.api.canchas.model.EmailVerificationToken;
import com.estadio.api.canchas.model.PasswordResetToken;
import com.estadio.api.canchas.model.RefreshToken;
import com.estadio.api.canchas.model.Rol;
import com.estadio.api.canchas.model.User;
import com.estadio.api.canchas.repository.EmailVerificationTokenRepository;
import com.estadio.api.canchas.repository.PasswordResetTokenRepository;
import com.estadio.api.canchas.service.ConfigPagoService;
import com.estadio.api.canchas.service.EmailService;
import com.estadio.api.canchas.service.IRolService;
import com.estadio.api.canchas.service.IUserService;
import com.estadio.api.canchas.service.RefreshTokenService;
import com.estadio.api.canchas.utils.JwtUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthenticationManager authenticationManager;
    private final IUserService userService;
    private final IRolService rolService;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final ConfigPagoService configPagoService;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final UserDetailsService userDetailsService;
    private final RefreshTokenService refreshTokenService;

    @Value("${google.client.id}")
    private String googleClientId;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody AuthRequestDTO dto) {

        String email = normalizeEmail(dto.getEmail());

        User existing = userService.findByEmail(email).orElse(null);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe una cuenta con ese email. Registrate para continuar.");
        }

        if (existing.isGoogleUser()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta cuenta fue creada con Google. Usa el boton \"Continuar con Google\" para ingresar.");
        }

        if (!existing.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "email_not_verified");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, dto.getPassword())
        );

        String token = jwtUtils.createToken(authentication);

        return ResponseEntity.ok(buildLoginResponse(token, existing));
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequestDTO dto) {

        String email = normalizeEmail(dto.getEmail());

        if (userService.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email.");
        }

        Rol rolUser = rolService.findByRolName("ROLE_USER")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Error de configuración: el rol ROLE_USER no existe en la base de datos."));

        User user = new User();
        user.setNombre(dto.getNombre().trim());
        user.setEmail(email);
        user.setPassword(userService.encriptPassword(dto.getPassword()));
        user.setCelular(dto.getCelular() != null && !dto.getCelular().isBlank() ? dto.getCelular().trim() : null);
        user.setRol(rolUser);
        user.setEnabled(false);
        user.setAccountNoExpired(true);
        user.setAccountNoLocked(true);
        user.setCredentialNoExpired(true);

        userService.save(user);

        generarYEnviarCodigoVerificacion(email);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "requiresVerification", true,
                "email", email,
                "message", "Te enviamos un codigo de verificacion a tu email."
        ));
    }

    @PostMapping("/verify-email")
    @Transactional
    public ResponseEntity<AuthResponseDTO> verifyEmail(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        String codigo = body.get("codigo");

        if (email.isBlank() || codigo == null || codigo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email y codigo son obligatorios.");
        }

        EmailVerificationToken token = verificationTokenRepository
                .findByEmailAndCodigoAndUsadoFalse(email, codigo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Codigo invalido o ya utilizado."));

        if (token.getExpiracion().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo ha expirado. Solicita uno nuevo.");
        }

        User user = userService.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        user.setEnabled(true);
        userService.save(user);

        token.setUsado(true);
        verificationTokenRepository.save(token);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String accessToken = jwtUtils.createTokenFromUserDetails(userDetails);

        return ResponseEntity.ok(buildLoginResponse(accessToken, user));
    }

    @PostMapping("/resend-verification")
    @Transactional
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email es obligatorio.");
        }

        User user = userService.findByEmail(email).orElse(null);
        if (user != null && !user.isEnabled() && !user.isGoogleUser()) {
            generarYEnviarCodigoVerificacion(email);
        }

        return ResponseEntity.ok(Map.of("message", "Si el email existe y no esta verificado, recibiras un nuevo codigo."));
    }

    private void generarYEnviarCodigoVerificacion(String email) {
        verificationTokenRepository.deleteByEmail(email);

        String codigo = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        EmailVerificationToken token = new EmailVerificationToken();
        token.setEmail(email);
        token.setCodigo(codigo);
        token.setExpiracion(LocalDateTime.now().plusMinutes(30));
        token.setUsado(false);
        verificationTokenRepository.save(token);

        ConfigPago config = configPagoService.getConfig();
        emailService.enviarCodigoVerificacion(email, codigo, config.getTitular());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private boolean isPasswordValida(String password) {
        return password != null
                && password.length() >= 8
                && password.length() <= 100
                && password.matches("^(?=.*[A-Za-z])(?=.*\\d).+$");
    }

    // El frontend llama a esto al recargar la página para verificar si el token sigue válido
    @GetMapping("/me")
    public ResponseEntity<AuthResponseDTO> me(@AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        return ResponseEntity.ok(new AuthResponseDTO(null, buildUsuarioInfo(user)));
    }

    // Renovar el access token usando el refresh token
    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<AuthResponseDTO> refresh(@RequestBody Map<String, String> body) {
        String refreshTokenStr = body.get("refreshToken");
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token requerido.");
        }

        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token inválido."));

        if (refreshToken.isExpired()) {
            refreshTokenService.deleteByUser(refreshToken.getUser());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expirado. Iniciá sesión nuevamente.");
        }

        User user = refreshToken.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newAccessToken = jwtUtils.createTokenFromUserDetails(userDetails);

        // Rotar el refresh token (genera uno nuevo por seguridad)
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        AuthResponseDTO response = new AuthResponseDTO(newAccessToken, newRefreshToken.getToken(), buildUsuarioInfo(user));
        return ResponseEntity.ok(response);
    }

    // Cerrar sesión: invalida el refresh token en la BD
    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<Map<String, String>> logout(@RequestBody(required = false) Map<String, String> body) {
        if (body != null) {
            String refreshTokenStr = body.get("refreshToken");
            if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
                refreshTokenService.findByToken(refreshTokenStr)
                        .ifPresent(rt -> refreshTokenService.deleteByUser(rt.getUser()));
            }
        }
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada correctamente."));
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email es obligatorio.");
        }

        User user = userService.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(Map.of("message", "Si el email existe, recibiras un codigo de verificacion."));
        }

        resetTokenRepository.deleteByEmail(email);

        String codigo = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setCodigo(codigo);
        token.setExpiracion(LocalDateTime.now().plusMinutes(15));
        token.setUsado(false);
        resetTokenRepository.save(token);

        ConfigPago config = configPagoService.getConfig();
        emailService.enviarCodigoRecuperacion(email, codigo, config.getTitular());

        return ResponseEntity.ok(Map.of("message", "Si el email existe, recibiras un codigo de verificacion."));
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        String codigo = body.get("codigo");
        String newPassword = body.get("password");

        if (email.isBlank() || codigo == null || newPassword == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email, codigo y nueva contrasena son obligatorios.");
        }

        if (!isPasswordValida(newPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La contrasena debe tener al menos 8 caracteres e incluir una letra y un numero.");
        }

        PasswordResetToken token = resetTokenRepository
                .findByEmailAndCodigoAndUsadoFalse(email, codigo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Codigo invalido o ya utilizado."));

        if (token.getExpiracion().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo ha expirado. Solicita uno nuevo.");
        }

        User user = userService.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        user.setPassword(userService.encriptPassword(newPassword));
        userService.save(user);

        token.setUsado(true);
        resetTokenRepository.save(token);

        return ResponseEntity.ok(Map.of("message", "Contrasena actualizada correctamente."));
    }

    @PostMapping("/google")
    @Transactional
    public ResponseEntity<AuthResponseDTO> googleLogin(@RequestBody Map<String, String> body) {
        String credential = body.get("credential");
        if (credential == null || credential.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token de Google es obligatorio.");
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(credential);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de Google invalido.");
        }

        if (idToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de Google invalido.");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = normalizeEmail(payload.getEmail());
        String nombre = (String) payload.get("name");

        User user = userService.findByEmail(email).orElse(null);

        if (user == null) {
            Rol rolUser = rolService.findByRolName("ROLE_USER")
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Error de configuración: el rol ROLE_USER no existe."));

            user = new User();
            user.setNombre(nombre != null ? nombre : email.split("@")[0]);
            user.setEmail(email);
            user.setPassword(null);
            user.setGoogleUser(true);
            user.setRol(rolUser);
            user.setEnabled(true);
            user.setAccountNoExpired(true);
            user.setAccountNoLocked(true);
            user.setCredentialNoExpired(true);
            userService.save(user);
        } else if (!user.isEnabled() && !user.isGoogleUser()) {
            // Cuenta creada con email/password sin verificar: Google ya verifico el email,
            // asi que la auto-verificamos y eliminamos cualquier token pendiente.
            user.setEnabled(true);
            userService.save(user);
            verificationTokenRepository.deleteByEmail(email);
        }

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu cuenta esta desactivada.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtils.createTokenFromUserDetails(userDetails);

        return ResponseEntity.ok(buildLoginResponse(token, user));
    }

    // Genera respuesta completa con access + refresh token (para login/register/google)
    private AuthResponseDTO buildLoginResponse(String accessToken, User user) {
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return new AuthResponseDTO(accessToken, refreshToken.getToken(), buildUsuarioInfo(user));
    }

    private AuthResponseDTO.UsuarioInfo buildUsuarioInfo(User user) {
        return new AuthResponseDTO.UsuarioInfo(
                user.getId(),
                user.getNombre(),
                user.getEmail(),
                user.getCelular(),
                user.getRol().getRolName(),
                user.isEnabled(),
                user.isGoogleUser()
        );
    }
}

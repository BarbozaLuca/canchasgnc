package com.estadio.api.canchas.utils;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    // 30 minutos en milisegundos
    private static final long EXPIRATION_MS = 1_800_000L;

    @Value("${security.jwt.private.key}")
    private String privateKey;

    @Value("${security.jwt.user.generator}")
    private String userGenerator;

    public String createToken(Authentication authentication) {
        Algorithm algorithm = Algorithm.HMAC256(this.privateKey);

        // getPrincipal() devuelve un UserDetails, no un String — toString() daba el objeto completo
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();

        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return JWT.create()
                .withIssuer(this.userGenerator)
                .withSubject(username)
                .withClaim("authorities", authorities)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .withJWTId(UUID.randomUUID().toString())
                .sign(algorithm);
    }

    // Crea un token directamente desde un UserDetails (para Google Login, sin password)
    public String createTokenFromUserDetails(UserDetails userDetails) {
        Algorithm algorithm = Algorithm.HMAC256(this.privateKey);

        String authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return JWT.create()
                .withIssuer(this.userGenerator)
                .withSubject(userDetails.getUsername())
                .withClaim("authorities", authorities)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .withJWTId(UUID.randomUUID().toString())
                .sign(algorithm);
    }

    public DecodedJWT validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(this.privateKey);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(this.userGenerator)
                    .build();
            return verifier.verify(token);
        } catch (JWTVerificationException ex) {
            // Re-lanzamos incluyendo el mensaje original para facilitar el diagnóstico
            throw new JWTVerificationException("Token inválido: " + ex.getMessage());
        }
    }

    public String extractUsername(DecodedJWT decodedJWT) {
        // getSubject() ya devuelve String, el .toString() original era redundante
        return decodedJWT.getSubject();
    }
}

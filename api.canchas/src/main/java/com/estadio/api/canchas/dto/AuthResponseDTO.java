package com.estadio.api.canchas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {

    private String token;
    private String refreshToken;
    private UsuarioInfo usuario;

    // Constructor sin refreshToken (para /me que no lo renueva)
    public AuthResponseDTO(String token, UsuarioInfo usuario) {
        this.token = token;
        this.refreshToken = null;
        this.usuario = usuario;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioInfo {
        private Long id;
        private String nombre;
        private String email;
        private String celular;
        private String rol;
        private boolean enabled;
        private boolean googleUser;
    }
}

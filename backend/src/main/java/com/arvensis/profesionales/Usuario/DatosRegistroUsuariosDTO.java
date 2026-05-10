package com.arvensis.profesionales.Usuario;

import jakarta.validation.constraints.NotBlank;

public record DatosRegistroUsuariosDTO(
        @NotBlank String nombre,
        @NotBlank String login,
        @NotBlank String clave,
        Rol rol
) {
}

package com.arvensis.profesionales.Usuario.Autenticacion;

import jakarta.validation.constraints.NotBlank;

public record DatosAutenticacionDTO(
        @NotBlank String login,
        @NotBlank String clave
) {
}

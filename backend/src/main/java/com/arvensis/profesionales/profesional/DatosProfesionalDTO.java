package com.arvensis.profesionales.profesional;

import jakarta.validation.constraints.NotBlank;

public record DatosProfesionalDTO(
    @NotBlank String nombre,
    @NotBlank String apellido,
    String email,
    String telefono,
    String direccion,
    Profesion profesion
) {
}

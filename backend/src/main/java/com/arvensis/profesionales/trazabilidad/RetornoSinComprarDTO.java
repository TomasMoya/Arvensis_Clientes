package com.arvensis.profesionales.trazabilidad;

import com.arvensis.profesionales.profesional.Profesion;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record RetornoSinComprarDTO(
        Long id,
        String nombre,
        String apellido,
        String email,
        String telefono,
        String direccion,
        Profesion profesion,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime fechaQueSeLeHablo
) {
}

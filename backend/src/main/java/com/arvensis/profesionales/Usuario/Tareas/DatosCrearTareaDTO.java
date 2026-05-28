package com.arvensis.profesionales.Usuario.Tareas;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record DatosCrearTareaDTO(
        @NotBlank String titulo,
        String descripcion,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime fechaLimite,
        Prioridad prioridad
) {
}

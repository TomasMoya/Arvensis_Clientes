package com.arvensis.profesionales.Usuario.Tareas;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record DatosActualizarTareaDTO(
        String titulo,
        String descripcion,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime fechaLimite,
        Prioridad prioridad,
        EstadoTarea estado
) {
}

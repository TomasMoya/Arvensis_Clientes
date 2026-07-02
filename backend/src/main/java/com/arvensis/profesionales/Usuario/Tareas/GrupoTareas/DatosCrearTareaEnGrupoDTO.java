package com.arvensis.profesionales.Usuario.Tareas.GrupoTareas;

import com.arvensis.profesionales.Usuario.Tareas.Prioridad;
import com.arvensis.profesionales.Usuario.Tareas.TipoTarea;
import com.arvensis.profesionales.Usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record DatosCrearTareaEnGrupoDTO(
        @NotBlank String titulo,
        String descripcion,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime fechaLimite,
        Prioridad prioridad,
        TipoTarea tipo,
        Long usuarioAsignadoId
) {
}

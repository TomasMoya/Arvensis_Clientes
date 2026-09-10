package com.arvensis.profesionales.Usuario.Tareas.Comentarios;

import jakarta.validation.constraints.NotBlank;

public record DatosCrearComentarioDTO(
        @NotBlank String contenido
) {}

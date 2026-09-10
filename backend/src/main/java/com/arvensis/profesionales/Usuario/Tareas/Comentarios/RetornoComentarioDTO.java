package com.arvensis.profesionales.Usuario.Tareas.Comentarios;

import java.time.LocalDateTime;

public record RetornoComentarioDTO(
        Long id,
        String contenido,
        LocalDateTime fechaCreacion,
        Long usuarioId,
        String usuarioNombre
) {}

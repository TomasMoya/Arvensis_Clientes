package com.arvensis.profesionales.Usuario.Tareas.Adjuntos;

import java.time.LocalDateTime;

public record RetornoAdjuntoDTO(
        Long id,
        String nombreOriginal,
        String tipoContenido,
        Long tamanioBytes,
        LocalDateTime fechaSubida,
        Long usuarioId,
        String usuarioNombre
) {}

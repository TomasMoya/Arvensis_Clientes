package com.arvensis.profesionales.Usuario.Tareas.CalendarioTareas;

import com.arvensis.profesionales.Usuario.Tareas.EstadoTarea;
import com.arvensis.profesionales.Usuario.Tareas.Prioridad;
import com.arvensis.profesionales.Usuario.Tareas.TipoTarea;

import java.time.LocalDateTime;

public record RetornoTareaCalendarioDTO(
        Long id,
        String titulo,
        String descripcion,
        LocalDateTime fechaLimite,
        Prioridad prioridad,
        EstadoTarea estado,
        TipoTarea tipo,
        Long usuarioId,
        Long grupoId,
        String grupoNombre,
        Long usuarioAsignadoId) {
}

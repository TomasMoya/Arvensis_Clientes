package com.arvensis.profesionales.Usuario.Tareas;

import java.time.LocalDateTime;

public record RetornoTareaDTO(Long id, String titulo, String descripcion,
                              LocalDateTime fechaLimite, Prioridad prioridad, EstadoTarea estado, TipoTarea tipo)
{}

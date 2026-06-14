package com.arvensis.profesionales.Usuario.Tareas.GrupoTareas;

import jakarta.validation.constraints.NotBlank;

public record DatosCrearGrupoDTO(
        @NotBlank String nombre,
        String descripcion
) {}

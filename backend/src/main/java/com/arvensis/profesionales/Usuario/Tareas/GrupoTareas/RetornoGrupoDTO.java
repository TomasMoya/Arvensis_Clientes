package com.arvensis.profesionales.Usuario.Tareas.GrupoTareas;

import com.arvensis.profesionales.Usuario.RetornoUsuarioDTO;

import java.util.List;

public record RetornoGrupoDTO(
        Long id,
        String nombre,
        String descripcion,
        List<RetornoUsuarioDTO> miembros
) {}

package com.arvensis.profesionales.Usuario.Tareas.GrupoTareas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GrupoTareasRepository extends JpaRepository<GrupoTareas, Long> {
    @Query("SELECT g FROM GrupoTareas g JOIN g.miembros m WHERE m.id = :usuarioId")
    List<GrupoTareas> findByMiembroId(@Param("usuarioId") Long usuarioId);
}

package com.arvensis.profesionales.Usuario.Tareas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByUsuarioId(Long id);

    @Query("SELECT t FROM Tarea t WHERE t.usuarioAsignado.id = :usuarioId")
    List<Tarea> findByUsuarioAsignadoId(@Param("usuarioId") Long usuarioId);
}

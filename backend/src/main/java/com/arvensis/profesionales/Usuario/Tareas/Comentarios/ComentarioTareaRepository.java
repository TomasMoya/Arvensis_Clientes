package com.arvensis.profesionales.Usuario.Tareas.Comentarios;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComentarioTareaRepository extends JpaRepository<ComentarioTarea, Long> {
    List<ComentarioTarea> findByTareaIdOrderByFechaCreacionAsc(Long tareaId);
}

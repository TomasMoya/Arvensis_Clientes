package com.arvensis.profesionales.Usuario.Tareas.Adjuntos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdjuntoTareaRepository extends JpaRepository<AdjuntoTarea, Long> {
    List<AdjuntoTarea> findByTareaIdOrderByFechaSubidaAsc(Long tareaId);
}

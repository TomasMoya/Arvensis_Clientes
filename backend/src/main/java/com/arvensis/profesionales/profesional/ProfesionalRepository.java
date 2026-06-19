package com.arvensis.profesionales.profesional;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProfesionalRepository extends JpaRepository<Profesional, Long> {
    @Query ("SELECT p FROM Profesional p WHERE p.estado = 'HABILITADO'")
    Page<Profesional> findByEstadoHabilitado(Pageable pageable);

    Page<Profesional> findByEstado(Estado estado, Pageable pageable);

    @Query ("SELECT p FROM Profesional p WHERE p.estado = 'DESHABILITADO'")
    Page<Profesional> findByEstadoDeshabilitado(Pageable pageable);

    boolean existsByEmail(String email);

    @Query ("SELECT p FROM Profesional p LEFT JOIN FETCH p.trazabilidad")
    List<Profesional> findAllWithTrazabilidad();
}

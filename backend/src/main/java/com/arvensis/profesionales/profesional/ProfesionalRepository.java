package com.arvensis.profesionales.profesional;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT p FROM Profesional p WHERE p.estado = 'HABILITADO' AND (" +
            "LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.apellido) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.telefono) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Profesional> buscar(@Param("q") String q, Pageable pageable);
}

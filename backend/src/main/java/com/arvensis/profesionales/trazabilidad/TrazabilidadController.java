package com.arvensis.profesionales.trazabilidad;

import com.arvensis.profesionales.profesional.Profesional;
import com.arvensis.profesionales.profesional.ProfesionalRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profesionales/{id}/trazabilidad")
@CrossOrigin(origins = "*")
public class TrazabilidadController {

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Autowired
    private TrazabilidadRepository trazabilidadRepository;

    @Transactional
    @PatchMapping
    public ResponseEntity actualizar(@PathVariable Long id, @RequestBody DatosTrazabilidadDTO datos) {
        Profesional profesional = profesionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));

        Trazabilidad trazabilidad = profesional.getTrazabilidad();

        if (trazabilidad == null) {
            trazabilidad = new Trazabilidad();
            profesional.setTrazabilidad(trazabilidad);
        }

        trazabilidad.actualizarDatos(datos);

        // Forzar flush para que persista antes de devolver
        profesionalRepository.saveAndFlush(profesional);

        // Recargar desde la base para devolver el objeto completo
        Profesional actualizado = profesionalRepository.findById(id).get();
        return ResponseEntity.ok(actualizado.getTrazabilidad());
    }

    @GetMapping
    public ResponseEntity mostrarTrazabilidad(@PathVariable Long id) {
        Profesional profesional = profesionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el registro con el id especificado"));
        Trazabilidad trazabilidad = profesional.getTrazabilidad();

        if(trazabilidad == null){
            return ResponseEntity.ok(new Trazabilidad());
        }
        return ResponseEntity.ok(trazabilidad);
    }
}

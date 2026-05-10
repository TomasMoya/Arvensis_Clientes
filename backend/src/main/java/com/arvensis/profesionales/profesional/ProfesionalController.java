package com.arvensis.profesionales.profesional;

import com.arvensis.profesionales.trazabilidad.RetornoSinComprarDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/profesionales")
@CrossOrigin(origins = "*")
public class ProfesionalController {

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Transactional
    @PostMapping
    public ResponseEntity agregarProfesional(@RequestBody @Valid DatosProfesionalDTO datosProfesional, UriComponentsBuilder uriComponentsBuilder) {
        var profesional = new Profesional(datosProfesional);
        profesionalRepository.save(profesional);

        URI uri = uriComponentsBuilder.fromPath("/profesionales/{id}").buildAndExpand(profesional.getId()).toUri();

        return ResponseEntity.created(uri).body("El profesional '" + datosProfesional.nombre() + " " + datosProfesional.apellido() + "' se guardó con éxito");
    }

    @GetMapping
    public ResponseEntity mostrarProfesionales(@RequestParam(required = false) String estado, @PageableDefault(size = 10) Pageable pageable) {
        if (estado != null) {
            return ResponseEntity.ok(profesionalRepository.findByEstado(Estado.valueOf(estado), pageable)
                    .map(p -> new RetornoProfesionalDTO(p.getId(), p.getNombre(), p.getApellido(), p.getEmail(), p.getTelefono(), p.getDireccion(), p.getPersonalAsignado(), p.getProfesion())));
        }

        return ResponseEntity.ok(profesionalRepository.findByEstadoHabilitado(pageable).map(p -> new RetornoProfesionalDTO(p.getId(), p.getNombre(), p.getApellido(), p.getEmail(), p.getTelefono(), p.getDireccion(), p.getPersonalAsignado(), p.getProfesion())));
    }

    @GetMapping("/deshabilitados")
    public ResponseEntity mostrarProfesionalesDeshabilitados(@PageableDefault(size = 10) Pageable pageable){
        return  ResponseEntity.ok(profesionalRepository.findByEstadoDeshabilitado(pageable).map(p -> new RetornoProfesionalDTO(p.getId(), p.getNombre(), p.getApellido(), p.getEmail(), p.getTelefono(), p.getDireccion(), p.getPersonalAsignado(), p.getProfesion())));
    }

    @GetMapping("/profesiones")
    public ResponseEntity mostrarProfesiones(){
        return ResponseEntity.ok(Profesion.values());
    }

    @GetMapping("/sin-compra")
    public ResponseEntity mostrarProfesionalesSinComprarDespuesDeTreintaDias(){
        LocalDateTime hace30Dias = LocalDateTime.now().minusDays(30);

        List<Profesional> profesionalesSinComprar = profesionalRepository.findAll()
                .stream()
                .filter(p -> p.getTrazabilidad() != null)
                .filter(p -> p.getTrazabilidad().isSeLeHablo())
                .filter(p -> !p.getTrazabilidad().isCompro())
                .filter(p -> p.getTrazabilidad().getFechaQueSeLeHablo().isBefore(hace30Dias))
                .toList();

        return ResponseEntity.ok(profesionalesSinComprar.stream().map(p -> new RetornoSinComprarDTO(p.getId(), p.getNombre(), p.getApellido(), p.getEmail(), p.getTelefono(), p.getDireccion(), p.getProfesion(), p.getTrazabilidad().getFechaQueSeLeHablo())));
    }

    @GetMapping("/{id}")
    public ResponseEntity mostrarProfesional(@PathVariable Long id){
        Profesional profesional = profesionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el registro con el id especificado"));

        return ResponseEntity.ok(new RetornoProfesionalDTO(profesional.getId(), profesional.getNombre(), profesional.getApellido(), profesional.getEmail(), profesional.getTelefono(), profesional.getDireccion(), profesional.getPersonalAsignado(), profesional.getProfesion()));
    }

    @Transactional
    @PatchMapping("/{id}/asignar")
    public ResponseEntity asignarPersonal(@PathVariable Long id, @RequestBody DatosAsignarPersonalDTO datosAsignarPersonal){
        Profesional profesional = profesionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el registro con el id especificado"));

        profesional.setPersonalAsignado(datosAsignarPersonal.personalAsignado());

        return ResponseEntity.ok().build();
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity deshabilitarProfesional(@PathVariable Long id){
        Profesional profesional = profesionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el registro con el id especificado"));
        profesional.deshabilitarProfesional();

        return ResponseEntity.noContent().build();
    }
}

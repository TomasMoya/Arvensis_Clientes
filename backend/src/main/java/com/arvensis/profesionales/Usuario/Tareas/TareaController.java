package com.arvensis.profesionales.Usuario.Tareas;

import com.arvensis.profesionales.Usuario.Usuario;
import com.arvensis.profesionales.Usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@RestController
@RequestMapping ("/usuarios/{usuarioId}/tareas")
@CrossOrigin(origins = "*")
public class TareaController {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity listar(@PathVariable Long usuarioId) {
        List<Tarea> propias = tareaRepository.findByUsuarioId(usuarioId);
        List<Tarea> asignadas = tareaRepository.findByUsuarioAsignadoId(usuarioId);

        // Unir y deduplicar
        Set<Long> ids = new HashSet<>();
        List<Tarea> todas = new ArrayList<>();
        Stream.concat(propias.stream(), asignadas.stream())
                .filter(t -> ids.add(t.getId()))
                .forEach(todas::add);

        return ResponseEntity.ok(todas.stream().map(t -> new RetornoTareaDTO(
                t.getId(), t.getTitulo(), t.getDescripcion(), t.getFechaLimite(),
                t.getPrioridad(), t.getEstado(), t.getTipo(),
                t.getUsuarioAsignado() != null ? t.getUsuarioAsignado().getId() : null,
                t.getUsuarioAsignado() != null ? t.getUsuarioAsignado().getNombre() : null
        )));
    }

    @Transactional
    @PostMapping
    public ResponseEntity crearTarea(@PathVariable Long usuarioId, @RequestBody @Valid DatosCrearTareaDTO datos){
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Tarea tarea = new Tarea();
        tarea.setTitulo(datos.titulo());
        tarea.setDescripcion(datos.descripcion());
        tarea.setFechaLimite(datos.fechaLimite());
        tarea.setEstado(EstadoTarea.PENDIENTE);
        tarea.setPrioridad(datos.prioridad());
        tarea.setTipo(datos.tipo());
        tarea.setUsuario(usuario);

        tareaRepository.save(tarea);
        return ResponseEntity.status(201).build();
    }

    @Transactional
    @PatchMapping("/{tareaId}")
    public ResponseEntity actualizar(@PathVariable Long usuarioId, @PathVariable Long tareaId,
                                     @RequestBody DatosActualizarTareaDTO datos){
        Tarea tarea = tareaRepository.findById(tareaId).orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));
        tarea.actualizarDatos(datos);

        return ResponseEntity.ok(new RetornoTareaDTO(tarea.getId(), tarea.getTitulo(), tarea.getDescripcion(), tarea.getFechaLimite(),
                tarea.getPrioridad(), tarea.getEstado(), tarea.getTipo(),
                tarea.getUsuarioAsignado() != null ? tarea.getUsuarioAsignado().getId() : null,
                tarea.getUsuarioAsignado() != null ? tarea.getUsuarioAsignado().getNombre() : null));
    }

    @Transactional
    @DeleteMapping("/{tareaId}")
    public ResponseEntity eliminar(@PathVariable Long tareaId){
        tareaRepository.deleteById(tareaId);
        return ResponseEntity.noContent().build();
    }
}

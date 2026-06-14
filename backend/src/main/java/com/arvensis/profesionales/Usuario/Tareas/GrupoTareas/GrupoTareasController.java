package com.arvensis.profesionales.Usuario.Tareas.GrupoTareas;

import com.arvensis.profesionales.Usuario.RetornoUsuarioDTO;
import com.arvensis.profesionales.Usuario.Tareas.*;
import com.arvensis.profesionales.Usuario.Usuario;
import com.arvensis.profesionales.Usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grupos")
@CrossOrigin(origins = "*")
public class GrupoTareasController {

    @Autowired private GrupoTareasRepository grupoRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired private TareaRepository tareaRepository;

    @PostMapping
    @Transactional
    public ResponseEntity crear(@RequestBody @Valid DatosCrearGrupoDTO datos,
                                Authentication authentication) {
        GrupoTareas grupo = new GrupoTareas();
        grupo.setNombre(datos.nombre());
        grupo.setDescripcion(datos.descripcion());

        // El creador se agrega automáticamente como miembro
        Usuario creador = (Usuario) authentication.getPrincipal();
        grupo.getMiembros().add(creador);

        grupoRepository.save(grupo);
        return ResponseEntity.status(201).body(new RetornoGrupoDTO(
                grupo.getId(), grupo.getNombre(), grupo.getDescripcion(), List.of()
        ));
    }

    @GetMapping("/mis-grupos")
    public ResponseEntity misGrupos(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        List<GrupoTareas> grupos = grupoRepository.findByMiembroId(usuario.getId());
        return ResponseEntity.ok(grupos.stream().map(g -> new RetornoGrupoDTO(
                g.getId(), g.getNombre(), g.getDescripcion(),
                g.getMiembros().stream().map(m -> new RetornoUsuarioDTO(
                        m.getId(), m.getNombre(), m.getLogin(), m.getRol()
                )).toList()
        )));
    }

    @PostMapping("/{grupoId}/miembros")
    @Transactional
    public ResponseEntity agregarMiembro(@PathVariable Long grupoId,
                                         @RequestBody DatosAsignarMiembroDTO datos) {
        GrupoTareas grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
        Usuario usuario = usuarioRepository.findById(datos.usuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        grupo.getMiembros().add(usuario);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{grupoId}/miembros/{usuarioId}")
    @Transactional
    public ResponseEntity quitarMiembro(@PathVariable Long grupoId,
                                        @PathVariable Long usuarioId) {
        GrupoTareas grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
        grupo.getMiembros().removeIf(m -> m.getId().equals(usuarioId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{grupoId}")
    @Transactional
    public ResponseEntity eliminar(@PathVariable Long grupoId) {
        grupoRepository.deleteById(grupoId);
        return ResponseEntity.noContent().build();
    }

    // Tareas del grupo
    @GetMapping("/{grupoId}/tareas")
    public ResponseEntity listarTareas(@PathVariable Long grupoId) {
        GrupoTareas grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
        return ResponseEntity.ok(grupo.getTareas().stream().map(t -> new RetornoTareaDTO(
                t.getId(), t.getTitulo(), t.getDescripcion(), t.getFechaLimite(),
                t.getPrioridad(), t.getEstado(), t.getTipo(),
                t.getUsuarioAsignado() != null ? t.getUsuarioAsignado().getId() : null,
                t.getUsuarioAsignado() != null ? t.getUsuarioAsignado().getNombre() : null
        )));
    }

    @PostMapping("/{grupoId}/tareas")
    @Transactional
    public ResponseEntity crearTarea(@PathVariable Long grupoId,
                                     @RequestBody @Valid DatosCrearTareaDTO datos,
                                     Authentication authentication) {
        GrupoTareas grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
        Usuario usuario = (Usuario) authentication.getPrincipal();
        Tarea tarea = new Tarea();
        tarea.setTitulo(datos.titulo());
        tarea.setDescripcion(datos.descripcion());
        tarea.setFechaLimite(datos.fechaLimite());
        tarea.setPrioridad(datos.prioridad());
        tarea.setEstado(EstadoTarea.PENDIENTE);
        tarea.setTipo(datos.tipo() != null ? datos.tipo() : TipoTarea.TAREA);
        tarea.setGrupoTareas(grupo);
        tarea.setUsuario(usuario);
        tareaRepository.save(tarea);
        return ResponseEntity.status(201).build();
    }

    @PatchMapping("/{grupoId}/tareas/{tareaId}")
    @Transactional
    public ResponseEntity actualizarTarea(@PathVariable Long grupoId,
                                          @PathVariable Long tareaId,
                                          @RequestBody DatosActualizarTareaDTO datos) {
        Tarea tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));
        tarea.actualizarDatos(datos);

        // Asignar usuario si viene en el DTO
        if (datos.usuarioAsignadoId() != null) {
            Usuario asignado = usuarioRepository.findById(datos.usuarioAsignadoId())
                    .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
            // Verificar que sea miembro del grupo
            GrupoTareas grupo = grupoRepository.findById(grupoId)
                    .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
            boolean esMiembro = grupo.getMiembros().stream()
                    .anyMatch(m -> m.getId().equals(datos.usuarioAsignadoId()));
            if (!esMiembro) return ResponseEntity.badRequest()
                    .body("El usuario no es miembro del grupo");
            tarea.setUsuarioAsignado(asignado);
        }

        return ResponseEntity.ok(new RetornoTareaDTO(
                tarea.getId(), tarea.getTitulo(), tarea.getDescripcion(),
                tarea.getFechaLimite(), tarea.getPrioridad(), tarea.getEstado(), tarea.getTipo(),
                tarea.getUsuarioAsignado() != null ? tarea.getUsuarioAsignado().getId() : null,
                tarea.getUsuarioAsignado() != null ? tarea.getUsuarioAsignado().getNombre() : null
        ));
    }

    @DeleteMapping("/{grupoId}/tareas/{tareaId}")
    @Transactional
    public ResponseEntity eliminarTarea(@PathVariable Long tareaId) {
        tareaRepository.deleteById(tareaId);
        return ResponseEntity.noContent().build();
    }
}

package com.arvensis.profesionales.Usuario.Tareas.Comentarios;

import com.arvensis.profesionales.Usuario.Rol;
import com.arvensis.profesionales.Usuario.Tareas.Tarea;
import com.arvensis.profesionales.Usuario.Tareas.TareaRepository;
import com.arvensis.profesionales.Usuario.Usuario;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/tareas/{tareaId}/comentarios")
@CrossOrigin(origins = "*")
public class ComentarioTareaController {

    @Autowired
    private ComentarioTareaRepository comentarioRepository;

    @Autowired
    private TareaRepository tareaRepository;

    @GetMapping
    public ResponseEntity listar(@PathVariable Long tareaId) {
        List<ComentarioTarea> comentarios = comentarioRepository.findByTareaIdOrderByFechaCreacionAsc(tareaId);
        return ResponseEntity.ok(comentarios.stream().map(this::aDTO).toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity crear(@PathVariable Long tareaId,
                                 @RequestBody @Valid DatosCrearComentarioDTO datos,
                                 Authentication authentication) {
        Tarea tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));
        Usuario usuario = (Usuario) authentication.getPrincipal();

        ComentarioTarea comentario = new ComentarioTarea();
        comentario.setContenido(datos.contenido());
        comentario.setFechaCreacion(LocalDateTime.now());
        comentario.setTarea(tarea);
        comentario.setUsuario(usuario);
        comentarioRepository.save(comentario);

        return ResponseEntity.status(201).body(aDTO(comentario));
    }

    @DeleteMapping("/{comentarioId}")
    @Transactional
    public ResponseEntity eliminar(@PathVariable Long comentarioId, Authentication authentication) {
        ComentarioTarea comentario = comentarioRepository.findById(comentarioId)
                .orElseThrow(() -> new EntityNotFoundException("Comentario no encontrado"));
        Usuario usuario = (Usuario) authentication.getPrincipal();
        boolean esAutor = comentario.getUsuario() != null && comentario.getUsuario().getId().equals(usuario.getId());
        if (!esAutor && usuario.getRol() != Rol.ADMIN) {
            return ResponseEntity.status(403).body("No podés eliminar comentarios de otro usuario");
        }
        comentarioRepository.delete(comentario);
        return ResponseEntity.noContent().build();
    }

    private RetornoComentarioDTO aDTO(ComentarioTarea c) {
        return new RetornoComentarioDTO(
                c.getId(), c.getContenido(), c.getFechaCreacion(),
                c.getUsuario() != null ? c.getUsuario().getId() : null,
                c.getUsuario() != null ? c.getUsuario().getNombre() : null
        );
    }
}

package com.arvensis.profesionales.Usuario.Tareas.CalendarioTareas;

import com.arvensis.profesionales.Usuario.Tareas.GrupoTareas.GrupoTareasRepository;
import com.arvensis.profesionales.Usuario.Tareas.Tarea;
import com.arvensis.profesionales.Usuario.Tareas.TareaRepository;
import com.arvensis.profesionales.Usuario.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@RestController
@RequestMapping("/calendario")
@CrossOrigin(origins = "*")
public class CalendarioController {

    @Autowired
    private GrupoTareasRepository grupoRepository;

    @Autowired
    private TareaRepository tareaRepository;

    @GetMapping
    public ResponseEntity obtenerTareas(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();

        //Tareas Propias
        List<Tarea> propias = tareaRepository.findByUsuarioId(usuario.getId());

        //Tareas grupales
        List<Tarea> asignadas = tareaRepository.findByUsuarioAsignadoId(usuario.getId());

        List<Tarea> grupales = grupoRepository.findByMiembroId(usuario.getId())
                .stream()
                .flatMap(g -> g.getTareas().stream())
                .toList();

        Set<Long> ids = new HashSet<>();
        List<Tarea> todas = new ArrayList<>();
        Stream.of(propias, asignadas, grupales)
                .flatMap(List::stream)
                .filter(t -> ids.add(t.getId()))
                .forEach(todas::add);

        return ResponseEntity.ok(todas.stream().map(t -> new RetornoTareaCalendarioDTO(
                t.getId(),
                t.getTitulo(),
                t.getDescripcion(),
                t.getFechaLimite(),
                t.getPrioridad(),
                t.getEstado(),
                t.getTipo(),
                t.getUsuario() != null ? t.getUsuario().getId() : null,
                t.getGrupoTareas() != null ? t.getGrupoTareas().getId() : null,
                t.getGrupoTareas() != null ? t.getGrupoTareas().getNombre() : null,
                t.getUsuarioAsignado() != null ? t.getUsuarioAsignado().getId() : null
        )));
    }
}

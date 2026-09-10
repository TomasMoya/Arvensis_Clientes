package com.arvensis.profesionales.Usuario.Tareas.Adjuntos;

import com.arvensis.profesionales.Usuario.Rol;
import com.arvensis.profesionales.Usuario.Tareas.Tarea;
import com.arvensis.profesionales.Usuario.Tareas.TareaRepository;
import com.arvensis.profesionales.Usuario.Usuario;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/tareas/{tareaId}/adjuntos")
@CrossOrigin(origins = "*")
public class AdjuntoTareaController {

    private static final Set<String> EXTENSIONES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "docx", "xlsx", "pdf", "txt");

    @Autowired
    private AdjuntoTareaRepository adjuntoRepository;

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private AlmacenamientoAdjuntosService almacenamiento;

    @GetMapping
    public ResponseEntity listar(@PathVariable Long tareaId) {
        List<AdjuntoTarea> adjuntos = adjuntoRepository.findByTareaIdOrderByFechaSubidaAsc(tareaId);
        return ResponseEntity.ok(adjuntos.stream().map(this::aDTO).toList());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity subir(@PathVariable Long tareaId,
                                 @RequestParam("file") MultipartFile archivo,
                                 Authentication authentication) throws IOException {
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body("El archivo está vacío");
        }

        String nombreOriginal = archivo.getOriginalFilename() != null ? archivo.getOriginalFilename() : "archivo";
        String extension = extraerExtension(nombreOriginal);
        if (extension == null || !EXTENSIONES_PERMITIDAS.contains(extension)) {
            return ResponseEntity.badRequest().body("Extensión no admitida. Permitidas: jpg, png, docx, xlsx, pdf, txt");
        }

        Tarea tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));
        Usuario usuario = (Usuario) authentication.getPrincipal();

        String nombreArchivo = almacenamiento.guardar(archivo, extension);

        AdjuntoTarea adjunto = new AdjuntoTarea();
        adjunto.setNombreOriginal(nombreOriginal);
        adjunto.setNombreArchivo(nombreArchivo);
        adjunto.setTipoContenido(archivo.getContentType());
        adjunto.setTamanioBytes(archivo.getSize());
        adjunto.setFechaSubida(LocalDateTime.now());
        adjunto.setTarea(tarea);
        adjunto.setUsuario(usuario);
        adjuntoRepository.save(adjunto);

        return ResponseEntity.status(201).body(aDTO(adjunto));
    }

    @GetMapping("/{adjuntoId}/descargar")
    public ResponseEntity<Resource> descargar(@PathVariable Long adjuntoId) throws MalformedURLException {
        AdjuntoTarea adjunto = adjuntoRepository.findById(adjuntoId)
                .orElseThrow(() -> new EntityNotFoundException("Adjunto no encontrado"));
        Path ruta = almacenamiento.resolver(adjunto.getNombreArchivo());
        Resource recurso = new UrlResource(ruta.toUri());
        if (!recurso.exists()) {
            return ResponseEntity.notFound().build();
        }

        String tipoContenido = adjunto.getTipoContenido() != null ? adjunto.getTipoContenido() : "application/octet-stream";
        String nombreCodificado = URLEncoder.encode(adjunto.getNombreOriginal(), StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(tipoContenido))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + nombreCodificado)
                .body(recurso);
    }

    @DeleteMapping("/{adjuntoId}")
    @Transactional
    public ResponseEntity eliminar(@PathVariable Long adjuntoId, Authentication authentication) {
        AdjuntoTarea adjunto = adjuntoRepository.findById(adjuntoId)
                .orElseThrow(() -> new EntityNotFoundException("Adjunto no encontrado"));
        Usuario usuario = (Usuario) authentication.getPrincipal();
        boolean esAutor = adjunto.getUsuario() != null && adjunto.getUsuario().getId().equals(usuario.getId());
        if (!esAutor && usuario.getRol() != Rol.ADMIN) {
            return ResponseEntity.status(403).body("No podés eliminar adjuntos de otro usuario");
        }
        almacenamiento.eliminar(adjunto.getNombreArchivo());
        adjuntoRepository.delete(adjunto);
        return ResponseEntity.noContent().build();
    }

    private String extraerExtension(String nombreArchivo) {
        int idx = nombreArchivo.lastIndexOf('.');
        if (idx < 0 || idx == nombreArchivo.length() - 1) return null;
        return nombreArchivo.substring(idx + 1).toLowerCase(Locale.ROOT);
    }

    private RetornoAdjuntoDTO aDTO(AdjuntoTarea a) {
        return new RetornoAdjuntoDTO(
                a.getId(), a.getNombreOriginal(), a.getTipoContenido(), a.getTamanioBytes(), a.getFechaSubida(),
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getUsuario() != null ? a.getUsuario().getNombre() : null
        );
    }
}

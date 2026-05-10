package com.arvensis.profesionales.Usuario;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    @PostMapping
    public ResponseEntity registrar(@RequestBody @Valid DatosRegistroUsuariosDTO datosRegistroUsuarios){
        if (usuarioRepository.findByLogin(datosRegistroUsuarios.login()) != null) {
            return ResponseEntity.badRequest().body("El usuario ya existe");
        }
        Usuario usuario = new Usuario(
                null,
                datosRegistroUsuarios.nombre(),
                datosRegistroUsuarios.login(),
                passwordEncoder.encode(datosRegistroUsuarios.clave()),
                datosRegistroUsuarios.rol() != null ? datosRegistroUsuarios.rol() : Rol.USER
        );
        usuarioRepository.save(usuario);
        return ResponseEntity.status(201).build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity listar() {
        return ResponseEntity.ok(usuarioRepository.findAll()
                .stream()
                .map(u -> new RetornoUsuarioDTO(u.getId(), u.getNombre(), u.getLogin(), u.getRol()))
                .toList());
    }

    @Transactional
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity eliminar(@PathVariable Long id) {
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PatchMapping("/{id}/rol")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity cambiarRol(@PathVariable Long id, @RequestBody DatosCambiarRolDTO datos) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        usuario.setRol(datos.rol());
        usuarioRepository.save(usuario);
        return ResponseEntity.ok().build();
    }
}

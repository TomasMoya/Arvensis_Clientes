package com.arvensis.profesionales.Usuario.Autenticacion;

import com.arvensis.profesionales.Usuario.Usuario;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/login")
@CrossOrigin(origins = "*")
public class AutenticationController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping
    public ResponseEntity autenticar(@RequestBody @Valid DatosAutenticacionDTO datosAutenticacion){
        Authentication authToken = new UsernamePasswordAuthenticationToken(
                datosAutenticacion.login(), datosAutenticacion.clave()
        );
        var usuarioAutenticado = authenticationManager.authenticate(authToken);
        var tokenJWT = tokenService.generarToken((Usuario) usuarioAutenticado.getPrincipal());
        return ResponseEntity.ok(new DatosTokenJwtDTO(tokenJWT));
    }
}

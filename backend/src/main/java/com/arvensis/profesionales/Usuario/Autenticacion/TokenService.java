package com.arvensis.profesionales.Usuario.Autenticacion;

import com.arvensis.profesionales.Usuario.Usuario;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class TokenService {

    @Value("${api.security.secret}")
    private String apiSecret;

    public String generarToken(Usuario usuario) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(apiSecret);
            return JWT.create()
                    .withIssuer("empleados")
                    .withSubject(usuario.getLogin())
                    .withClaim("rol", usuario.getRol().name())
                    .withExpiresAt(fechaExpiracion())
                    .sign(algorithm);
        } catch (JWTCreationException e) {
            throw new RuntimeException("Error al generar token", e);
        }
    }

    public String getSubject(String token){
        try {
            Algorithm algorithm = Algorithm.HMAC256(apiSecret);
            return JWT.require(algorithm)
                    .withIssuer("empleados")
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException e){
            throw new RuntimeException("Token inválido o expirado", e);
        }
    }

    private Instant fechaExpiracion(){
        return LocalDateTime.now()
                .plusHours(8)
                .toInstant(ZoneOffset.of("-03:00"));
    }
}

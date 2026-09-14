package com.arvensis.sueldos.seguridad;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * No emite tokens: el login sigue siendo el del backend de Gestion.
 * Esta app solo verifica que el JWT sea valido, con el mismo secreto e issuer.
 */
@Service
public class TokenService {

    @Value("${api.security.secret}")
    private String apiSecret;

    public DecodedJWT verificar(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(apiSecret);
            return JWT.require(algorithm)
                    .withIssuer("empleados")
                    .build()
                    .verify(token);
        } catch (JWTVerificationException e) {
            throw new RuntimeException("Token invalido o expirado", e);
        }
    }
}

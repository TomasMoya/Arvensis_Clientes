package com.arvensis.sueldos.seguridad;

import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Valida el mismo JWT que emite el login de Gestion. No hay tabla de usuarios propia:
 * el login (subject del token) y el rol (claim "rol") vienen ya resueltos en el token.
 *
 * Ademas del token valido, exige que el login este en la lista de accesos permitidos
 * (app.acceso.permitidos) — es el unico control de permisos que tiene esta app por ahora.
 */
@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Value("${app.acceso.permitidos}")
    private String loginsPermitidosRaw;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        var tokenJWT = recuperarToken(request);
        if (tokenJWT != null) {
            try {
                DecodedJWT decoded = tokenService.verificar(tokenJWT);
                String login = decoded.getSubject();
                String rol = decoded.getClaim("rol").asString();

                if (!loginPermitido(login)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"No tenes acceso a Sueldos.\"}");
                    return;
                }

                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + rol));
                var authentication = new UsernamePasswordAuthenticationToken(login, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException e) {
                // Token invalido o vencido: seguimos sin autenticar, el endpoint protegido devuelve 401.
            }
        }
        filterChain.doFilter(request, response);
    }

    private boolean loginPermitido(String login) {
        if (login == null) return false;
        Set<String> permitidos = Stream.of(loginsPermitidosRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        return permitidos.contains(login.toLowerCase());
    }

    private String recuperarToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.replace("Bearer ", "");
    }
}

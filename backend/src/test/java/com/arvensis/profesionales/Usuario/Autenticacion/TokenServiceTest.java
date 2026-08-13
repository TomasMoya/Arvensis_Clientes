package com.arvensis.profesionales.Usuario.Autenticacion;

import com.arvensis.profesionales.Usuario.Rol;
import com.arvensis.profesionales.Usuario.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.Assertions;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
public class TokenServiceTest {

    @Mock
    private static Usuario usuario;
    @InjectMocks
    private TokenService service;

    @BeforeEach
    void setUp() {
        service = new TokenService();
        ReflectionTestUtils.setField(service, "apiSecret", "claveSecretaPrueba");
    }

    @Test
    void confirmarTokenJWT() {
        usuario = new Usuario();
        usuario.setNombre("prueba");
        usuario.setLogin("loginprueba");
        usuario.setClave("claveprueba");
        usuario.setRol(Rol.ADMIN);

        var token = service.generarToken(usuario);

        Assertions.assertFalse(token.isEmpty());
    }
}

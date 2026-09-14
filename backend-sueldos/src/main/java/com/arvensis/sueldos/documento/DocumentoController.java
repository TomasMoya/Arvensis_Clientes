package com.arvensis.sueldos.documento;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/db")
public class DocumentoController {

    private static final Long ID_UNICO = 1L;

    private final DocumentoRepository repository;

    public DocumentoController(DocumentoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<String> obtener() {
        return repository.findById(ID_UNICO)
                .map(d -> ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(d.getDatosJson()))
                .orElse(ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body("null"));
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> guardar(@RequestBody String datosJson) {
        Documento doc = repository.findById(ID_UNICO).orElseGet(Documento::new);
        doc.setId(ID_UNICO);
        doc.setDatosJson(datosJson);
        doc.setActualizado(Instant.now());
        repository.save(doc);
        return ResponseEntity.noContent().build();
    }
}

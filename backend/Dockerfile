FROM amazoncorretto:21-alpine
ARG JAR_FILE=target/clientes_arvensis-0.0.1.jar
COPY ${JAR_FILE} app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
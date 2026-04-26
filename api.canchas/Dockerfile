# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copiar Maven wrapper y pom primero (mejor cache de capas)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copiar fuente y compilar
COPY src ./src
RUN ./mvnw package -DskipTests -B

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Zona horaria Argentina
ENV TZ=America/Argentina/Buenos_Aires

# JAR desde el stage de build
COPY --from=build /app/target/api.canchas-0.0.1.jar app.jar

# Directorios para imágenes subidas y logs (se montan como volumen)
RUN mkdir -p uploads/canchas uploads/comprobantes logs

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]

# syntax=docker/dockerfile:1
# Multi-stage build (docs/12 §2): Gradle build → slim JRE runtime, non-root.

# ---- build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
# Warm the dependency cache before copying sources for better layer reuse.
RUN ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar -x test

# ---- runtime ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
# Run as a non-root user (docs/12 §2).
RUN groupadd --system gatherly && useradd --system --gid gatherly --home /app gatherly
COPY --from=build /app/build/libs/*.jar app.jar
# Container-aware heap (docs/12 §2).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0"
USER gatherly
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

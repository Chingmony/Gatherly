# build jar file
FROM gradle:8.8-jdk21-jammy AS build
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY src src

# make gradlew runnable and skip tests for speed
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

# run the jar
FROM eclipse-temurin:21.0.7_6-jre-ubi9-minimal AS run
WORKDIR /app
COPY --from=build /app/build/libs/*.jar /app/app.jar

CMD ["java", "-jar", "/app/app.jar"]
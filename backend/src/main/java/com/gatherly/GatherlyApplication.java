package com.gatherly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Gatherly — Event Management Platform.
 *
 * <p>Strict layered architecture (Controller → Service → Repository), stateless backend,
 * event-scoped authorization. See {@code docs/00}–{@code docs/13} for the full blueprint.
 */
@SpringBootApplication
public class GatherlyApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatherlyApplication.class, args);
    }
}

package com.gatherly;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Walking-skeleton proof (docs/13 §M0): the full context boots against real Postgres and the
 * Flyway migrations (V1 schema + V2 seed) apply cleanly — verified by checking a seeded row.
 */
class ApplicationContextIT extends AbstractIntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void contextLoadsAndMigrationsApplied() {
        Integer orgCount = jdbc.queryForObject("SELECT count(*) FROM organization", Integer.class);
        assertThat(orgCount).isEqualTo(1); // singleton org seeded by V2

        Integer defaultTemplates = jdbc.queryForObject(
                "SELECT count(*) FROM agenda_template WHERE is_default = true", Integer.class);
        assertThat(defaultTemplates).isGreaterThanOrEqualTo(1);
    }
}

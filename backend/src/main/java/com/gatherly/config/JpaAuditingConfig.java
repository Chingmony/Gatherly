package com.gatherly.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables JPA auditing so {@code @CreatedDate}/{@code @LastModifiedDate} on
 * {@link com.gatherly.common.domain.BaseEntity} are populated automatically (docs/02 §1).
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}

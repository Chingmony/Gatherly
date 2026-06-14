package com.gatherly.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Persisted refresh-token record ({@code docs/02} §3.12). Only the SHA-256 {@code token_hash} is
 * stored — never the raw token. Rotation chains via {@code replaced_by}; reuse of a revoked token
 * revokes the whole chain ({@code docs/03} §2.3).
 *
 * <p>Does not extend {@code BaseEntity}: this table has no {@code updated_at} column.
 */
@Entity
@Table(name = "refresh_token")
@Getter
@Setter
@NoArgsConstructor
public class RefreshToken {

  @Id @GeneratedValue private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "token_hash", nullable = false, unique = true)
  private String tokenHash;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(nullable = false)
  private boolean revoked = false;

  @Column(name = "replaced_by")
  private UUID replacedBy;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false, nullable = false)
  private Instant createdAt;

  public boolean isActive(Instant now) {
    return !revoked && expiresAt.isAfter(now);
  }
}

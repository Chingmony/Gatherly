package com.gatherly.repository;

import com.gatherly.domain.RefreshToken;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  /** Revoke every active token for a user (e.g. on password reset, or chain compromise). */
  @Modifying
  @Query(
      "UPDATE RefreshToken t SET t.revoked = true WHERE t.userId = :userId AND t.revoked = false")
  int revokeAllForUser(@Param("userId") UUID userId);

  /** Cleanup job ({@code docs/06} §7): delete expired or revoked rows. */
  @Modifying
  @Query("DELETE FROM RefreshToken t WHERE t.revoked = true OR t.expiresAt < :now")
  int deleteExpiredOrRevoked(@Param("now") Instant now);
}

package com.gatherly.repository;

import com.gatherly.domain.Event;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, UUID> {

  boolean existsBySlug(String slug);

  Optional<Event> findBySlug(String slug);

  Optional<Event> findByRegistrationQrToken(String registrationQrToken);

  @Query(
      """
      SELECT e FROM Event e
      WHERE (CAST(:q AS string) IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
      """)
  Page<Event> search(@Param("q") String q, Pageable pageable);

  /** Assignment-scoped listing for non-admins ({@code docs/00} §5: others see assigned only). */
  @Query(
      """
      SELECT e FROM Event e
      WHERE e.id IN :ids
        AND (CAST(:q AS string) IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
      """)
  Page<Event> searchScoped(
      @Param("ids") Collection<UUID> ids, @Param("q") String q, Pageable pageable);
}

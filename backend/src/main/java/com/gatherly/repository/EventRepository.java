package com.gatherly.repository;

import com.gatherly.domain.Event;
import java.time.Instant;
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
      WHERE (:q IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
      """)
  Page<Event> search(@Param("q") String q, Pageable pageable);

  /** Assignment-scoped listing for non-admins ({@code docs/00} §5: others see assigned only). */
  @Query(
      """
      SELECT e FROM Event e
      WHERE e.id IN :ids
        AND (:q IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
      """)
  Page<Event> searchScoped(
      @Param("ids") Collection<UUID> ids, @Param("q") String q, Pageable pageable);

  /**
   * Public discovery listing ({@code docs/03} §4.9): only PUBLIC events, with optional guest filters
   * — name search ({@code q}), exact {@code category}, and {@code location} substring (matched on
   * venue). Non-public events are never returned, so drafts/archived events cannot leak to guests.
   * Backs the {@code /explore} browse + registration surface (rich {@code PublicEventResponse}).
   */
  @Query(
      """
      SELECT e FROM Event e
      WHERE e.status = com.gatherly.domain.EventStatus.PUBLIC
        AND (:q IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
        AND (:category IS NULL OR e.category = :category)
        AND (:location IS NULL
             OR LOWER(e.venue) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%')))
      """)
  Page<Event> searchPublic(
      @Param("q") String q,
      @Param("category") String category,
      @Param("location") String location,
      Pageable pageable);

  /**
   * Public discovery listing ({@code GET /public/events}): only PUBLIC events, with optional title
   * substring and start-time range filters ({@code from}/{@code to} bound {@code startsAt}). Backs
   * {@code EventService.listPublic} (slim {@code PublicEventResponse}).
   */
  @Query(
      """
      SELECT e FROM Event e
      WHERE e.status = com.gatherly.domain.EventStatus.PUBLIC
        AND (:q IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
        AND (:from IS NULL OR e.startsAt >= :from)
        AND (:to IS NULL OR e.startsAt <= :to)
      """)
  Page<Event> searchPublic(
      @Param("q") String q,
      @Param("from") Instant from,
      @Param("to") Instant to,
      Pageable pageable);
}

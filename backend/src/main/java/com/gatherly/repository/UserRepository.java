package com.gatherly.repository;

import com.gatherly.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCase(String email);

  /** Admin user search by email or full name (case-insensitive), paginated. */
  @Query(
      """
      SELECT u FROM User u
      WHERE (:q IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                       OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')))
      """)
  Page<User> search(@Param("q") String q, Pageable pageable);
}

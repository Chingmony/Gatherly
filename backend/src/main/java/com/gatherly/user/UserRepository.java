package com.gatherly.user;

import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    /** Case-insensitive search over email + full name for the Admin user list (docs/03 §4.2). */
    Page<User> findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(
            String email, String fullName, Pageable pageable);

    /**
     * Assignable directory for the event member picker (docs/03 §4.5): every non-admin user, by
     * name. Bounded by the single-org user count (v1); Admins are excluded because they are never
     * assigned an event-scoped role. Indexed by {@code idx_user_global_role} (docs/02).
     */
    List<User> findByGlobalRoleOrderByFullNameAsc(GlobalRole globalRole);
}

package com.gatherly.security;

import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.User;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * Authenticated principal placed in the {@code SecurityContext}. Exposes {@code id} so SpEL self
 * gates ({@code #userId == authentication.principal.id}, {@code docs/03} §3) work. Carries only the
 * global role; event-scoped roles are resolved per request by {@link EventSecurityService}.
 */
public record UserPrincipal(UUID id, String email, GlobalRole role) {

  public static UserPrincipal from(User user) {
    return new UserPrincipal(user.getId(), user.getEmail(), user.getGlobalRole());
  }

  public Collection<? extends GrantedAuthority> authorities() {
    return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
  }

  /**
   * JavaBean-style accessor so {@code @PreAuthorize} SpEL ({@code authentication.principal.id}) can
   * read the id — SpEL's reflective property accessor looks for {@code getId()}, not the record's
   * {@code id()} component.
   */
  public UUID getId() {
    return id;
  }
}

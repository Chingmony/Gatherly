package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Application user ({@code docs/02} §3.2). {@code password_hash} is BCrypt and must never be
 * serialized — DTO mapping ({@code UserResponse}) omits it.
 *
 * <p>Global role is {@code ADMIN}, {@code SUB_ADMIN}, or {@code USER}; event-scoped roles
 * (MANAGER/HANDLER) live in {@code event_assignment}, not here.
 */
@Entity
@Table(name = "\"user\"")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "full_name", nullable = false)
  private String fullName;

  @Column private String phone;

  @Enumerated(EnumType.STRING)
  @Column
  private Gender gender;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column private String address;

  @Column(name = "avatar_key")
  private String avatarKey;

  @Enumerated(EnumType.STRING)
  @Column(name = "global_role", nullable = false)
  private GlobalRole globalRole;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserStatus status = UserStatus.ACTIVE;

  public boolean isActive() {
    return status == UserStatus.ACTIVE;
  }
}

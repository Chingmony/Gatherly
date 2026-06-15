package com.gatherly.user;

import com.gatherly.user.domain.User;
import com.gatherly.user.dto.UserResponse;
import com.gatherly.user.dto.UserScope;

/**
 * Hand-written mapping (docs/06 §1) for the sensitive {@link User} projection — guarantees
 * {@code passwordHash} is never copied into a response DTO.
 */
public final class UserMapper {

    private UserMapper() {
    }

    /** Base projection without assignment scope (self-service, invite, update echoes). */
    public static UserResponse toResponse(User u) {
        return toResponse(u, UserScope.NONE);
    }

    /** Admin Users-table projection enriched with the user's event-assignment scope (docs/03 §4.2). */
    public static UserResponse toResponse(User u, UserScope scope) {
        UserScope s = scope == null ? UserScope.NONE : scope;
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getPhone(),
                u.getGender(),
                u.getDateOfBirth(),
                u.getAddress(),
                u.getAvatarKey(),
                u.getGlobalRole(),
                u.getDefaultEventRole(),
                u.getStatus(),
                s.count(),
                s.singleEventName(),
                u.getCreatedAt(),
                u.getUpdatedAt());
    }
}

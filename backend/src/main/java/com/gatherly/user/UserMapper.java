package com.gatherly.user;

import com.gatherly.user.domain.User;
import com.gatherly.user.dto.UserResponse;

/**
 * Hand-written mapping (docs/06 §1) for the sensitive {@link User} projection — guarantees
 * {@code passwordHash} is never copied into a response DTO.
 */
public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User u) {
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
                u.getStatus(),
                u.getCreatedAt(),
                u.getUpdatedAt());
    }
}

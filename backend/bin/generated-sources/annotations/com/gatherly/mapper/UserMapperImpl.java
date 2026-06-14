package com.gatherly.mapper;

import com.gatherly.domain.Gender;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.User;
import com.gatherly.domain.UserStatus;
import com.gatherly.dto.user.UserResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-15T02:54:41+0700",
    comments = "version: 1.6.0, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl extends UserMapper {

    @Override
    public UserResponse toResponse(User user) {
        if ( user == null ) {
            return null;
        }

        UUID id = null;
        String email = null;
        String fullName = null;
        String phone = null;
        Gender gender = null;
        LocalDate dateOfBirth = null;
        String address = null;
        GlobalRole globalRole = null;
        UserStatus status = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = user.getId();
        email = user.getEmail();
        fullName = user.getFullName();
        phone = user.getPhone();
        gender = user.getGender();
        dateOfBirth = user.getDateOfBirth();
        address = user.getAddress();
        globalRole = user.getGlobalRole();
        status = user.getStatus();
        createdAt = user.getCreatedAt();
        updatedAt = user.getUpdatedAt();

        String avatarUrl = rustfs.presignGet(user.getAvatarKey());

        UserResponse userResponse = new UserResponse( id, email, fullName, phone, gender, dateOfBirth, address, globalRole, status, createdAt, updatedAt, avatarUrl );

        return userResponse;
    }
}

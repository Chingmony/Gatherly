package com.gatherly.mapper;

import com.gatherly.domain.User;
import com.gatherly.dto.user.UserResponse;
import org.mapstruct.Mapper;

/** Entity → safe DTO mapping. Never exposes {@code passwordHash}. */
@Mapper(componentModel = "spring")
public interface UserMapper {

  UserResponse toResponse(User user);
}

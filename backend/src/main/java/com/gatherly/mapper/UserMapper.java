package com.gatherly.mapper;

import com.gatherly.domain.User;
import com.gatherly.dto.user.UserResponse;
import com.gatherly.integration.rustfs.RustfsClient;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

/** Entity → safe DTO mapping. Never exposes {@code passwordHash}. */
@Mapper(componentModel = "spring")
public abstract class UserMapper {

  @Autowired protected RustfsClient rustfs;

  /** Resolves the stored avatar key to a short-lived presigned GET URL the client can render. */
  @Mapping(target = "avatarUrl", expression = "java(rustfs.presignGet(user.getAvatarKey()))")
  public abstract UserResponse toResponse(User user);
}

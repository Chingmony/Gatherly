package com.gatherly.dto.auth;

import com.gatherly.dto.user.UserResponse;

/**
 * Login result. The access JWT is also set as an httpOnly cookie (used by the web app); {@code
 * accessToken} is returned here for API clients / the Swagger <em>Authorize</em> button.
 */
public record LoginResponse(
    String tokenType, String accessToken, long expiresInSeconds, UserResponse user) {}

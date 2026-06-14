package com.gatherly.service;

import com.gatherly.domain.User;

/**
 * Result of a login/refresh: the authenticated user plus the freshly issued credential pair. The
 * controller is responsible for writing these as httpOnly cookies ({@code docs/03} §1).
 *
 * @param user the authenticated user
 * @param accessToken signed HS256 access JWT
 * @param refreshToken raw (un-hashed) refresh token — only its hash is persisted
 */
public record AuthTokens(User user, String accessToken, String refreshToken) {}

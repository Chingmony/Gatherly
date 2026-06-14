package com.gatherly.domain;

/** Account lifecycle ({@code docs/02} §4). {@code INACTIVE} users are rejected at login. */
public enum UserStatus {
  ACTIVE,
  INACTIVE
}

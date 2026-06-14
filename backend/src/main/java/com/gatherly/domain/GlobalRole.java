package com.gatherly.domain;

/** Coarse RBAC layer carried in the JWT ({@code docs/02} §4). Event-scoped roles live elsewhere. */
public enum GlobalRole {
  ADMIN,
  MEMBER
}

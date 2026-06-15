package com.gatherly.user.dto;

/**
 * A user's event-assignment scope for the admin Users table (docs/03 §4.2): how many events they are
 * assigned to, and — when exactly one — that event's name (so the table can show the name instead of
 * a count). Admins are not assignment-scoped; the UI shows "All events" for them regardless.
 */
public record UserScope(long count, String singleEventName) {

    public static final UserScope NONE = new UserScope(0, null);
}

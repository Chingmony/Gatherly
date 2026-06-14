package com.gatherly.common.error;

/** Unknown id / unresolvable token → {@code 404 NOT_FOUND} (docs/07 §4). */
public class NotFoundException extends AppException {

    public NotFoundException(String message) {
        super(ErrorCode.NOT_FOUND, message);
    }
}

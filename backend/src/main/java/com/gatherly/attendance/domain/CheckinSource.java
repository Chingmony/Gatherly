package com.gatherly.attendance.domain;

/**
 * How an attendance row was created (docs/02 §3.11, §4). {@code QR_SCAN} is the organizer scanning
 * the guest's QR; {@code MANUAL} is a staff override without a QR (manager-gated, docs/03 §4.10).
 */
public enum CheckinSource {
    QR_SCAN,
    MANUAL
}

package com.gatherly.organization.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Admin org-profile edit (docs/03 §4.3). {@code logoKey}/{@code bannerKey} are Rustfs object keys
 * obtained from a prior presign (docs/04 §4.4); they are optional (null leaves the asset unset).
 */
public record UpdateOrganizationRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 5000) String description,
        String logoKey,
        String bannerKey,
        @Email @Size(max = 255) String contactEmail,
        @Size(max = 25) String contactPhone
) {
}

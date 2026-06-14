package com.gatherly.organization.domain;

import com.gatherly.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Single-row global organization profile (docs/02 §3.1). There is exactly one row (seeded in
 * {@code V2__seed.sql} with a fixed id); {@code logoKey}/{@code bannerKey} reference Rustfs
 * objects (docs/04 §4) — entities store the object <b>key</b>, never a full URL.
 *
 * <p>Editable by Admin only (docs/03 §4.3).
 */
@Entity
@Table(name = "organization")
public class Organization extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(name = "logo_key")
    private String logoKey;

    @Column(name = "banner_key")
    private String bannerKey;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    public Organization() {
        // JPA
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLogoKey() {
        return logoKey;
    }

    public void setLogoKey(String logoKey) {
        this.logoKey = logoKey;
    }

    public String getBannerKey() {
        return bannerKey;
    }

    public void setBannerKey(String bannerKey) {
        this.bannerKey = bannerKey;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
}

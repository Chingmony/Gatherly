package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Single-row global organization profile ({@code docs/02} §3.1). Editable by Admin only. {@code
 * logoKey}/{@code bannerKey} hold Rustfs object keys (not URLs — see {@code docs/04} §4.3).
 */
@Entity
@Table(name = "organization")
@Getter
@Setter
@NoArgsConstructor
public class Organization extends BaseEntity {

  @Column(nullable = false)
  private String name;

  @Column private String description;

  @Column(name = "logo_key")
  private String logoKey;

  @Column(name = "banner_key")
  private String bannerKey;

  @Column(name = "contact_email")
  private String contactEmail;

  @Column(name = "contact_phone")
  private String contactPhone;
}

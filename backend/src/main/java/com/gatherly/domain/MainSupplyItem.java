package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Global supply catalog item ({@code docs/02} §3.5). Admin-owned; referenced by {@code
 * material.catalog_item_id} with {@code ON DELETE RESTRICT}, so an in-use item cannot be deleted.
 */
@Entity
@Table(name = "main_supply_item")
@Getter
@Setter
@NoArgsConstructor
public class MainSupplyItem extends BaseEntity {

  @Column(nullable = false)
  private String name;

  @Column private String description;

  @Column private String unit;

  @Column(name = "default_quantity")
  private Integer defaultQuantity;

  @Column(nullable = false)
  private boolean active = true;
}

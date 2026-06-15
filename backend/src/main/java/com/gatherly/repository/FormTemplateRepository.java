package com.gatherly.repository;

import com.gatherly.domain.FormTemplate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Persistence for reusable {@link FormTemplate}s (org-wide; no event scoping). */
public interface FormTemplateRepository extends JpaRepository<FormTemplate, UUID> {

  /** All templates, most-recently-updated first (the form builder list order). */
  List<FormTemplate> findAllByOrderByUpdatedAtDesc();
}

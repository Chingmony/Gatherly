package com.gatherly.config;

import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the bootstrap Admin from env (docs/02 §8, docs/13 §M1) — credentials are never hard-coded
 * in a migration. Idempotent: runs after Flyway on startup and creates the admin only if the
 * email is not already present.
 */
@Component
public class BootstrapAdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;

    public BootstrapAdminSeeder(UserRepository users, PasswordEncoder passwordEncoder,
                                @Value("${gatherly.bootstrap.admin.email:}") String email,
                                @Value("${gatherly.bootstrap.admin.password:}") String password,
                                @Value("${gatherly.bootstrap.admin.name:Gatherly Admin}") String fullName) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.warn("Bootstrap admin not configured (BOOTSTRAP_ADMIN_EMAIL/PASSWORD); skipping seed.");
            return;
        }
        if (users.existsByEmailIgnoreCase(email)) {
            log.debug("Bootstrap admin {} already present; skipping seed.", email);
            return;
        }
        User admin = new User();
        admin.setEmail(email.toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setFullName(fullName);
        admin.setGlobalRole(GlobalRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        users.save(admin);
        log.info("Seeded bootstrap admin: {}", email);
    }
}

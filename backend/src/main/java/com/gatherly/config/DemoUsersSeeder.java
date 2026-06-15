package com.gatherly.config;

import com.gatherly.event.domain.EventRole;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Local-only demo accounts so the role-based UI can be exercised without the email-activation flow:
 * an ACTIVE Sub-admin (MANAGER designation) and Handler with a known password. Restricted to the
 * {@code local} profile so demo credentials never exist in prod or in tests, and gated further by
 * {@code gatherly.bootstrap.demo-users.enabled}. Idempotent — mirrors {@link BootstrapAdminSeeder}.
 *
 * <p>These start unassigned (no event scope). Assign them to events from the Users / Events console
 * to see the Sub-admin/Handler scoped views populate.
 */
@Component
@Profile("local")
public class DemoUsersSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUsersSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String password;

    public DemoUsersSeeder(UserRepository users, PasswordEncoder passwordEncoder,
                           @Value("${gatherly.bootstrap.demo-users.enabled:true}") boolean enabled,
                           @Value("${gatherly.bootstrap.demo-users.password:Demo1234!}") String password) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.debug("Demo users disabled (gatherly.bootstrap.demo-users.enabled=false); skipping.");
            return;
        }
        seed("subadmin@gatherly.local", "Sofia Marquez", EventRole.MANAGER);
        seed("handler@gatherly.local", "Liam Carter", EventRole.HANDLER);
    }

    private void seed(String email, String fullName, EventRole eventRole) {
        if (users.existsByEmailIgnoreCase(email)) {
            log.debug("Demo user {} already present; skipping.", email);
            return;
        }
        User u = new User();
        u.setEmail(email.toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setFullName(fullName);
        u.setGlobalRole(GlobalRole.MEMBER);     // demo accounts are never global Admins
        u.setDefaultEventRole(eventRole);       // MANAGER → Sub-admin, HANDLER → Handler
        u.setStatus(UserStatus.ACTIVE);         // ACTIVE so they can log in without activation
        users.save(u);
        log.info("Seeded demo {} login: {} / '{}'", eventRole, email, password);
    }
}

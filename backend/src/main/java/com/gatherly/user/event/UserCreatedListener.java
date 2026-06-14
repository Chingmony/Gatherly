package com.gatherly.user.event;

import com.gatherly.auth.ActivationService;
import com.gatherly.integration.email.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * After the invite transaction commits (docs/06 §2, §3a), mint a single-use activation token and
 * email the set-password link. Running after commit means a slow/failed mail server can never roll
 * back user creation; {@link EmailService} swallows its own send failures.
 */
@Component
public class UserCreatedListener {

    private final ActivationService activation;
    private final EmailService email;
    private final String publicBaseUrl;

    public UserCreatedListener(ActivationService activation, EmailService email,
                               @Value("${gatherly.app.public-base-url:http://localhost:3000}") String publicBaseUrl) {
        this.activation = activation;
        this.email = email;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/$", "");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserCreated(UserCreatedEvent event) {
        String token = activation.mint(event.userId());
        String link = publicBaseUrl + "/auth/set-password?token=" + token;
        email.sendActivation(event.email(), event.fullName(), link);
    }
}

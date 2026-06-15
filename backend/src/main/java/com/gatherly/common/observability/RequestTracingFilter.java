package com.gatherly.common.observability;

import com.gatherly.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Per-request correlation + structured access log (docs/08 §2). Sets the MDC {@code traceId} (honors
 * an inbound {@code X-Request-Id} from the edge, else mints one) and echoes it on the response, so
 * one id ties together app logs, the audit trail ({@link com.gatherly.audit.AuditService}), and the
 * client error body ({@code traceId}). Registered inside the security chain after authentication so
 * {@code userId} is resolvable. Standard fields per docs/08 §2; never logs PII or secrets.
 */
public class RequestTracingFilter extends OncePerRequestFilter {

    private static final Logger access = LoggerFactory.getLogger("gatherly.access");
    private static final String TRACE_ID = "traceId";
    private static final String USER_ID = "userId";
    private static final String HEADER = "X-Request-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String traceId = request.getHeader(HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        MDC.put(TRACE_ID, traceId);
        response.setHeader(HEADER, traceId);
        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            putUserId();
            long durationMs = (System.nanoTime() - start) / 1_000_000;
            access.info("{} {} -> {} ({}ms)",
                    request.getMethod(), request.getRequestURI(), response.getStatus(), durationMs);
            MDC.clear();
        }
    }

    private void putUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            MDC.put(USER_ID, principal.id().toString());
        }
    }
}

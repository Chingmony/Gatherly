package com.gatherly.material;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.event.EventAssignmentRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Materials + 5-state workflow matrix (docs/02 §5, docs/03 §4.6/§4.7, docs/06 §5) — release-blocking.
 * Proves: supply catalog is Admin-only (Sub-admin delete forbidden), event materials honour
 * {@code canManage}, a Handler may advance their own assigned material but never approve/reopen
 * (elevated transitions), illegal edges are rejected, and the audit trail + My Tasks read back.
 */
class MaterialFlowIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired EventRepository eventRepo;
    @Autowired EventAssignmentRepository assignmentRepo;
    @Autowired MaterialRepository materialRepo;
    @Autowired MainSupplyItemRepository supplyRepo;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder encoder;

    private static final String PW = "Passw0rd!";
    private UUID managerId;   // m1 — appointed MANAGER (Sub-admin) on the event
    private UUID handlerId;   // m2 — HANDLER, material assigned to them
    private UUID otherId;     // m3 — HANDLER on the event but NOT assigned the material

    @BeforeEach
    void seed() {
        materialRepo.deleteAll();
        supplyRepo.deleteAll();
        assignmentRepo.deleteAll();
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", GlobalRole.ADMIN);
        managerId = save("m1@gatherly.test", GlobalRole.MEMBER).getId();
        handlerId = save("m2@gatherly.test", GlobalRole.MEMBER).getId();
        otherId = save("m3@gatherly.test", GlobalRole.MEMBER).getId();
    }

    @AfterEach
    void cleanup() {
        materialRepo.deleteAll();
        supplyRepo.deleteAll();
        assignmentRepo.deleteAll();
        eventRepo.deleteAll();
    }

    @Test
    void materialWorkflowMatrix() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventA = idOf(admin.post("/api/v1/events", "{\"title\":\"Event A\"}").body());

        // Crew: m1 = MANAGER, m2 + m3 = HANDLER on Event A.
        assertThat(admin.post("/api/v1/events/" + eventA + "/assignments",
                "{\"userId\":\"%s\",\"role\":\"SUB_ADMIN\"}".formatted(managerId)).statusCode()).isEqualTo(201);
        assertThat(admin.post("/api/v1/events/" + eventA + "/assignments",
                "{\"userId\":\"%s\",\"role\":\"HANDLER\"}".formatted(handlerId)).statusCode()).isEqualTo(201);
        assertThat(admin.post("/api/v1/events/" + eventA + "/assignments",
                "{\"userId\":\"%s\",\"role\":\"HANDLER\"}".formatted(otherId)).statusCode()).isEqualTo(201);

        HttpTestClient manager = login("m1@gatherly.test");
        HttpTestClient handler = login("m2@gatherly.test");
        HttpTestClient other = login("m3@gatherly.test");

        // ---- Main supply list: Admin-only (docs/03 §4.6) --------------------
        assertThat(manager.post("/api/v1/supply-items", "{\"name\":\"Chairs\"}").statusCode()).isEqualTo(403);
        String supplyId = idOf(admin.post("/api/v1/supply-items",
                "{\"name\":\"Chairs\",\"unit\":\"pcs\",\"defaultQuantity\":50}").body());
        assertThat(admin.put("/api/v1/supply-items/" + supplyId,
                "{\"name\":\"Folding chairs\"}").statusCode()).isEqualTo(200);
        // Sub-admin (event MANAGER) can never delete a main supply item (absolute restriction, docs/00 §5).
        assertThat(manager.delete("/api/v1/supply-items/" + supplyId).statusCode()).isEqualTo(403);
        assertThat(admin.get("/api/v1/supply-items").statusCode()).isEqualTo(200);

        // ---- Material create: canManage (docs/03 §4.7) ----------------------
        // Handler cannot create a material.
        assertThat(handler.post("/api/v1/events/" + eventA + "/materials",
                "{\"name\":\"Banner\"}").statusCode()).isEqualTo(403);
        // Manager creates one, linked to the catalog item and assigned to the handler.
        HttpResponse<String> created = manager.post("/api/v1/events/" + eventA + "/materials",
                "{\"name\":\"Banner\",\"quantity\":2,\"catalogItemId\":\"%s\",\"assignedTo\":\"%s\"}"
                        .formatted(supplyId, handlerId));
        assertThat(created.statusCode()).isEqualTo(201);
        String materialId = idOf(created.body());

        // Referenced supply item cannot be deleted (FK RESTRICT → clean 409).
        assertThat(admin.delete("/api/v1/supply-items/" + supplyId).statusCode()).isEqualTo(409);

        // ---- List read: canView; non-member blocked ------------------------
        assertThat(handler.get("/api/v1/events/" + eventA + "/materials").statusCode()).isEqualTo(200);

        // ---- Status machine (docs/02 §5, docs/06 §5) -----------------------
        // Assigned handler advances their own material.
        assertThat(handler.patch("/api/v1/materials/" + materialId + "/status",
                "{\"toStatus\":\"IN_PROGRESS\"}").statusCode()).isEqualTo(200);
        // A different handler (not assigned this material) is blocked (docs/03 line 260).
        assertThat(other.patch("/api/v1/materials/" + materialId + "/status",
                "{\"toStatus\":\"NEEDS_REVIEW\"}").statusCode()).isEqualTo(403);
        // Handler submits for review...
        assertThat(handler.patch("/api/v1/materials/" + materialId + "/status",
                "{\"toStatus\":\"NEEDS_REVIEW\"}").statusCode()).isEqualTo(200);
        // ...but may NOT approve (elevated edge → 403, even on own material).
        assertThat(handler.patch("/api/v1/materials/" + materialId + "/status",
                "{\"toStatus\":\"DONE\"}").statusCode()).isEqualTo(403);
        // Manager approves.
        assertThat(manager.patch("/api/v1/materials/" + materialId + "/status",
                "{\"toStatus\":\"DONE\",\"note\":\"looks good\"}").statusCode()).isEqualTo(200);

        // Illegal transition on a fresh material → 409 ILLEGAL_TRANSITION.
        String m2Id = idOf(manager.post("/api/v1/events/" + eventA + "/materials",
                "{\"name\":\"Stage\",\"assignedTo\":\"%s\"}".formatted(handlerId)).body());
        HttpResponse<String> illegal = handler.patch("/api/v1/materials/" + m2Id + "/status",
                "{\"toStatus\":\"DONE\"}");
        assertThat(illegal.statusCode()).isEqualTo(409);
        assertThat(illegal.body()).contains("ILLEGAL_TRANSITION");

        // ---- History (canViewMaterial) + My Tasks --------------------------
        HttpResponse<String> history = handler.get("/api/v1/materials/" + materialId + "/history");
        assertThat(history.statusCode()).isEqualTo(200);
        assertThat(history.body()).contains("NEEDS_REVIEW").contains("DONE");

        HttpResponse<String> mine = handler.get("/api/v1/materials/mine");
        assertThat(mine.statusCode()).isEqualTo(200);
        assertThat(mine.body()).contains("Banner").contains("Stage").contains("Event A");
    }

    @Test
    void unassignedMemberCannotTouchMaterials() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventA = idOf(admin.post("/api/v1/events", "{\"title\":\"Private\"}").body());
        String materialId = idOf(admin.post("/api/v1/events/" + eventA + "/materials",
                "{\"name\":\"Secret\"}").body());

        HttpTestClient stranger = login("m3@gatherly.test"); // no assignment on the event
        assertThat(stranger.get("/api/v1/events/" + eventA + "/materials").statusCode()).isEqualTo(403);
        assertThat(stranger.patch("/api/v1/materials/" + materialId + "/status",
                "{\"toStatus\":\"IN_PROGRESS\"}").statusCode()).isEqualTo(403);
        assertThat(stranger.get("/api/v1/materials/" + materialId + "/history").statusCode()).isEqualTo(403);
        // ...but their own (empty) task list is always readable.
        assertThat(stranger.get("/api/v1/materials/mine").statusCode()).isEqualTo(200);
    }

    private HttpTestClient login(String email) {
        HttpTestClient c = new HttpTestClient(port);
        c.post("/api/v1/auth/login", "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, PW));
        return c;
    }

    private static String idOf(String json) {
        Matcher m = ID.matcher(json);
        if (!m.find()) {
            throw new AssertionError("No id in: " + json);
        }
        return m.group(1);
    }

    private User save(String email, GlobalRole role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(PW));
        u.setFullName("Test " + email);
        u.setGlobalRole(role);
        u.setStatus(UserStatus.ACTIVE);
        return users.save(u);
    }
}

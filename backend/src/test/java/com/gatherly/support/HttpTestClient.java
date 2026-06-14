package com.gatherly.support;

import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Cookie-aware HTTP helper for auth integration tests: a {@link CookieManager} persists the
 * auth cookies across calls, so login → subsequent requests behave like a real browser session.
 */
public class HttpTestClient {

    private final HttpClient client;
    private final String baseUrl;

    public HttpTestClient(int port) {
        this.client = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
        this.baseUrl = "http://localhost:" + port;
    }

    public CookieManager cookies() {
        return (CookieManager) client.cookieHandler().orElseThrow();
    }

    public HttpResponse<String> get(String path) {
        return send(req(path).GET().build());
    }

    public HttpResponse<String> post(String path, String json) {
        return send(req(path).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json == null ? "" : json)).build());
    }

    public HttpResponse<String> put(String path, String json) {
        return send(req(path).header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(json == null ? "" : json)).build());
    }

    public HttpResponse<String> patch(String path, String json) {
        return send(req(path).header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString(json == null ? "" : json)).build());
    }

    public HttpResponse<String> delete(String path) {
        return send(req(path).DELETE().build());
    }

    private HttpRequest.Builder req(String path) {
        return HttpRequest.newBuilder(URI.create(baseUrl + path)).header("Accept", "application/json");
    }

    private HttpResponse<String> send(HttpRequest request) {
        try {
            return client.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

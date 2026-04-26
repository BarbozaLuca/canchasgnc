package com.estadio.api.canchas.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiter por IP usando ventana fija (fixed window).
 *
 * Tres niveles:
 *   - AUTH  → login, register, forgot/reset-password, google  (más estricto)
 *   - WRITE → POST, PATCH, DELETE que no sean auth
 *   - READ  → GET
 *
 * Cuando se supera el límite se responde 429 Too Many Requests.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    @Value("${rate.limit.auth:10}")
    private int authLimit;

    @Value("${rate.limit.write:30}")
    private int writeLimit;

    @Value("${rate.limit.read:60}")
    private int readLimit;

    // Ventana en milisegundos (1 minuto)
    private static final long WINDOW_MS = 60_000;

    // key = "IP:tier", value = bucket
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String ip = resolveClientIp(request);
        String path = request.getRequestURI();
        String method = request.getMethod();

        // No limitar preflight CORS
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        Tier tier = resolveTier(path, method);
        int limit = switch (tier) {
            case AUTH -> authLimit;
            case WRITE -> writeLimit;
            case READ -> readLimit;
        };

        String key = ip + ":" + tier.name();
        Bucket bucket = buckets.compute(key, (k, existing) -> {
            long now = System.currentTimeMillis();
            if (existing == null || now - existing.windowStart > WINDOW_MS) {
                return new Bucket(now);
            }
            return existing;
        });

        int count = bucket.counter.incrementAndGet();

        // Headers informativos
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - count)));

        if (count > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiadas solicitudes. Intenta de nuevo en un momento.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Tier resolveTier(String path, String method) {
        // Endpoints de autenticación → límite más estricto
        if (path.startsWith("/api/auth/") && !"GET".equalsIgnoreCase(method)) {
            return Tier.AUTH;
        }
        // Escrituras generales
        if ("POST".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
            return Tier.WRITE;
        }
        return Tier.READ;
    }

    private String resolveClientIp(HttpServletRequest request) {
        // Soporte para proxies (Nginx, Cloudflare, etc.)
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Limpia entradas expiradas del mapa cada 2 minutos.
     * Un bucket expira cuando su ventana de 1 minuto ya terminó, o sea que
     * ya no tiene efecto sobre requests actuales y puede descartarse de memoria.
     */
    @Scheduled(fixedRate = 120_000)
    public void limpiarBucketsExpirados() {
        long now = System.currentTimeMillis();
        int antes = buckets.size();
        buckets.entrySet().removeIf(e -> now - e.getValue().windowStart > WINDOW_MS);
        int eliminados = antes - buckets.size();
        if (eliminados > 0) {
            log.debug("RateLimiter: {} buckets expirados eliminados. Quedan: {}", eliminados, buckets.size());
        }
    }

    private enum Tier { AUTH, WRITE, READ }

    private static class Bucket {
        final long windowStart;
        final AtomicInteger counter = new AtomicInteger(0);

        Bucket(long windowStart) {
            this.windowStart = windowStart;
        }
    }
}

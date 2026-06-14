package com.gatherly.config;

import java.util.concurrent.Executor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Task executor for post-commit side effects (OTP/QR email, Telegram push) so external integrations
 * never block or roll back the user's transaction ({@code docs/06} §2).
 */
@Configuration
@EnableAsync
public class AsyncConfig {

  @Bean(name = "sideEffectExecutor")
  public Executor sideEffectExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(8);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("side-effect-");
    executor.initialize();
    return executor;
  }
}

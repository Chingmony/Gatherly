package com.gatherly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GatherlyApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatherlyApplication.class, args);
    }
}

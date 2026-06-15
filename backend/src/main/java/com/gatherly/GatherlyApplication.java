package com.gatherly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class GatherlyApplication {

  public static void main(String[] args) {
    SpringApplication.run(GatherlyApplication.class, args);
  }
}

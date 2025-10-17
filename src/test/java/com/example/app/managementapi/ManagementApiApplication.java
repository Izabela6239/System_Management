package com.example.app.managementapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan(basePackages = "com.example.app.entities") // pachetul unde ai entitățile
public class ManagementApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ManagementApiApplication.class, args);
    }
}

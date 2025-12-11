package com.example.app.managementapi.ManagementApiApplication.admin;

import com.example.app.managementapi.ManagementApiApplication.auth.SpringContext;
import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.auth.UserRole;
import com.example.app.managementapi.ManagementApiApplication.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import jakarta.persistence.PostPersist;

@Component
@RequiredArgsConstructor
public class AdminListener {
    @PostPersist
    public void onPostPersist(Admin admin) {
        UserRepository userRepository = SpringContext.getBean(UserRepository.class);
        if (userRepository.findByUsername(admin.getUsername()).isEmpty()) {
            User user = new User();
            user.setUsername(admin.getUsername());
            user.setPassword(admin.getPassword());
            user.setRole(UserRole.ADMIN);
            user.setAdminId(admin.getId());
            user.setActive(admin.getActive());
            userRepository.save(user);
            System.out.println("✅ Migrated new admin: " + admin.getUsername());
        }
    }
}

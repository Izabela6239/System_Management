package com.example.app.managementapi.ManagementApiApplication.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
//in repo facem query urile pe care le am face in mod normal in mysql
public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsername(String username);
    Optional<Admin> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    @Query("SELECT a FROM Admin a WHERE a.id = :userId")
    Optional<Admin> findByUserId(@Param("userId") Long userId);
}

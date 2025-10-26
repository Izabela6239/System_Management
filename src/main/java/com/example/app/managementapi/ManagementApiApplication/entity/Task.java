package com.example.app.managementapi.ManagementApiApplication.entity;

import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String type;
    private Integer difficulty; // 1..5

    @Column(columnDefinition = "JSON")
    private String requiredSkillsJson;

    @ManyToOne
    @JoinColumn(name = "admin_id") // coloana din tabela task
    private Admin admin;

    private Integer plannedDurationMin;
    private Integer predictedDurationMin;
    private java.time.LocalDateTime deadline;
    private Integer priority = 3;
    private Double revenue = 0.0;
    private Double otherCosts = 0.0;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.NEW;

    @OneToMany(mappedBy = "task")
    private List<Assignment> assignments;

    @OneToOne(mappedBy = "task")
    private AiTaskHistory aiHistory;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }

    public String getRequiredSkillsJson() {
        return requiredSkillsJson;
    }

    public void setRequiredSkillsJson(String requiredSkillsJson) {
        this.requiredSkillsJson = requiredSkillsJson;
    }

    public Admin getAdmin() {
        return admin;
    }

    public void setAdmin(Admin admin) {
        this.admin = admin;
    }

    public Integer getPlannedDurationMin() {
        return plannedDurationMin;
    }

    public void setPlannedDurationMin(Integer plannedDurationMin) {
        this.plannedDurationMin = plannedDurationMin;
    }

    public Integer getPredictedDurationMin() {
        return predictedDurationMin;
    }

    public void setPredictedDurationMin(Integer predictedDurationMin) {
        this.predictedDurationMin = predictedDurationMin;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Double getRevenue() {
        return revenue;
    }

    public void setRevenue(Double revenue) {
        this.revenue = revenue;
    }

    public Double getOtherCosts() {
        return otherCosts;
    }

    public void setOtherCosts(Double otherCosts) {
        this.otherCosts = otherCosts;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public List<Assignment> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<Assignment> assignments) {
        this.assignments = assignments;
    }

    public AiTaskHistory getAiHistory() {
        return aiHistory;
    }

    public void setAiHistory(AiTaskHistory aiHistory) {
        this.aiHistory = aiHistory;
    }
}



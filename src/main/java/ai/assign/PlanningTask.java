package ai.assign;

import lombok.Getter;
import lombok.Setter;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.variable.PlanningVariable;

import java.time.LocalDateTime;
import java.util.Set;

@Setter
@Getter
@PlanningEntity
public class PlanningTask {
    private Long taskId;
    private Set<String> requiredSkills;
    private Integer difficulty;    // 1..5
    private Integer durationMin;   // predicted/planned
    private LocalDateTime deadline;
    private Integer priority;      // 1..5

    @PlanningVariable(valueRangeProviderRefs = "employeeRange")
    private PlanningEmployee assigned;

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public Set<String> getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(Set<String> requiredSkills) {
        this.requiredSkills = requiredSkills;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getDurationMin() {
        return durationMin;
    }

    public void setDurationMin(Integer durationMin) {
        this.durationMin = durationMin;
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

    public PlanningEmployee getAssigned() {
        return assigned;
    }

    public void setAssigned(PlanningEmployee assigned) {
        this.assigned = assigned;
    }
}

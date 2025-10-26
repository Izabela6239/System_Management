package com.example.app.managementapi.ManagementApiApplication.ai.assign;

import lombok.Getter;
import lombok.Setter;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;

import java.util.List;

@Setter
@Getter
@PlanningSolution
public class AssignmentSolution {

    // getters / setters
    @ProblemFactCollectionProperty
    @ValueRangeProvider(id = "employeeRange")
    private List<PlanningEmployee> employees;

    @PlanningEntityCollectionProperty
    private List<PlanningTask> tasks;

    @PlanningScore
    private HardSoftScore score;

    public List<PlanningEmployee> getEmployees() {
        return employees;
    }

    public void setEmployees(List<PlanningEmployee> employees) {
        this.employees = employees;
    }

    public List<PlanningTask> getTasks() {
        return tasks;
    }

    public void setTasks(List<PlanningTask> tasks) {
        this.tasks = tasks;
    }

    public HardSoftScore getScore() {
        return score;
    }

    public void setScore(HardSoftScore score) {
        this.score = score;
    }
}

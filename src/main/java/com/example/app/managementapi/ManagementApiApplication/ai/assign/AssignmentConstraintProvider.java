package com.example.app.managementapi.ManagementApiApplication.ai.assign;

import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class AssignmentConstraintProvider implements ConstraintProvider {

    @Override
    public Constraint[] defineConstraints(ConstraintFactory f) {
        return new Constraint[] {
                avoidLeave(f),
                capacityHard(f),
                skillMismatchPenalty(f),
                highPriorityReward(f),
                qualityBiasReward(f),
                speedReward(f)
        };
    }

    private Constraint avoidLeave(ConstraintFactory f) {
        return f.forEach(PlanningTask.class)
                .filter(t -> t.getAssigned() != null
                        && t.getDeadline() != null
                        && t.getAssigned().getLeaves().contains(t.getDeadline().toLocalDate()))
                .penalize(HardSoftScore.ONE_HARD, t -> 1000)
                .asConstraint("Leave conflict");
    }

    private Constraint capacityHard(ConstraintFactory f) {
        return f.forEach(PlanningTask.class)
                .filter(t -> t.getAssigned() != null
                        && t.getDurationMin() != null
                        && t.getAssigned().getCapacityMinPerDay() < t.getDurationMin())
                .penalize(HardSoftScore.ONE_HARD, t -> 1000)
                .asConstraint("Capacity exceeded");
    }

    private Constraint skillMismatchPenalty(ConstraintFactory f) {
        return f.forEach(PlanningTask.class)
                .filter(t -> t.getAssigned() != null
                        && jaccard(t.getRequiredSkills(), t.getAssigned().getSkills()) < 0.4)
                .penalize(HardSoftScore.ONE_SOFT, t -> 200)
                .asConstraint("Skill mismatch");
    }

    private Constraint highPriorityReward(ConstraintFactory f) {
        return f.forEach(PlanningTask.class)
                .filter(t -> t.getPriority() != null)
                .reward(HardSoftScore.ONE_SOFT, t -> t.getPriority() * 10)
                .asConstraint("High priority");
    }

    private Constraint qualityBiasReward(ConstraintFactory f) {
        return f.forEach(PlanningTask.class)
                .filter(t -> t.getAssigned() != null)
                .reward(HardSoftScore.ONE_SOFT,
                        t -> (int) Math.round(50 * t.getAssigned().getAvgQuality()))
                .asConstraint("Quality bias");
    }

    private Constraint speedReward(ConstraintFactory f) {
        return f.forEach(PlanningTask.class)
                .filter(t -> t.getAssigned() != null)
                .reward(HardSoftScore.ONE_SOFT,
                        t -> (int) Math.round(50 * (1.0 / Math.max(0.5, t.getAssigned().getRecentSpeed()))))
                .asConstraint("Speed bias");
    }

    private double jaccard(Set<String> a, Set<String> b) {
        if (a == null || b == null || a.isEmpty() || b.isEmpty()) return 0.0;
        int inter = 0;
        for (var s : a) if (b.contains(s)) inter++;
        int uni = a.size() + b.size() - inter;
        return uni == 0 ? 0.0 : (double) inter / uni;
    }
}
package ai.assign;

import java.time.LocalDate;
import java.util.Set;

public class PlanningEmployee {
    private Long employeeId;
    private Set<String> skills;
    private int capacityMinPerDay; // ex: 480
    private Set<LocalDate> leaves; // zile de concediu
    private double recentSpeed;    // ~1.0 (1.0 = normal)
    private double avgQuality;     // 0..1

    // getters / setters
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Set<String> getSkills() { return skills; }
    public void setSkills(Set<String> skills) { this.skills = skills; }
    public int getCapacityMinPerDay() { return capacityMinPerDay; }
    public void setCapacityMinPerDay(int capacityMinPerDay) { this.capacityMinPerDay = capacityMinPerDay; }
    public Set<LocalDate> getLeaves() { return leaves; }
    public void setLeaves(Set<LocalDate> leaves) { this.leaves = leaves; }
    public double getRecentSpeed() { return recentSpeed; }
    public void setRecentSpeed(double recentSpeed) { this.recentSpeed = recentSpeed; }
    public double getAvgQuality() { return avgQuality; }
    public void setAvgQuality(double avgQuality) { this.avgQuality = avgQuality; }
}

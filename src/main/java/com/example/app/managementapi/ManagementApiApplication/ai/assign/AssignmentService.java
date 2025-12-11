package com.example.app.managementapi.ManagementApiApplication.ai.assign;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeSkill;
import com.example.app.managementapi.ManagementApiApplication.employee.Skill;
import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.task.Assignment;
import com.example.app.managementapi.ManagementApiApplication.task.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.task.Task;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.example.app.managementapi.ManagementApiApplication.task.AssignmentRepository;
import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveRequestRepository;
import com.example.app.managementapi.ManagementApiApplication.task.TaskRepository;

import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private final SolverFactory<AssignmentSolution> solverFactory;
    private final EmployeeRepository employeeRepo;
    private final TaskRepository taskRepo;
    private final LeaveRequestRepository leaveRepo;
    private final AssignmentRepository assignmentRepo;

    private final ObjectMapper mapper = new ObjectMapper();

    public AssignmentService(SolverFactory<AssignmentSolution> solverFactory,
                             EmployeeRepository employeeRepo,
                             TaskRepository taskRepo,
                             LeaveRequestRepository leaveRepo,
                             AssignmentRepository assignmentRepo) {
        this.solverFactory = solverFactory;
        this.employeeRepo = employeeRepo;
        this.taskRepo = taskRepo;
        this.leaveRepo = leaveRepo;
        this.assignmentRepo = assignmentRepo;
    }

    @Transactional(readOnly = true)
    public AssignmentSolution suggest() {
        List<PlanningEmployee> employees = employeeRepo.findActive().stream()
                .map(this::toPlanningEmployee)
                .toList();

        List<PlanningTask> tasks = taskRepo.findUnassigned().stream()
                .map(this::toPlanningTask)
                .toList();

        AssignmentSolution problem = new AssignmentSolution();
        problem.setEmployees(employees);
        problem.setTasks(tasks);

        Solver<AssignmentSolution> solver = solverFactory.buildSolver();
        return solver.solve(problem);
    }

    @Transactional
    public Map<Long, Long> commit(Map<Long, Long> taskToEmployee) {
        Map<Long, Long> result = new LinkedHashMap<>();
        for (var e : taskToEmployee.entrySet()) {
            Long taskId = e.getKey();
            Long empId  = e.getValue();
            if (empId == null) { result.put(taskId, null); continue; }

            Task t = taskRepo.findById(taskId).orElse(null);
            Employee emp = employeeRepo.findById(empId).orElse(null);
            if (t == null || emp == null) { result.put(taskId, null); continue; }

            Assignment a = new Assignment();
            a.setTask(t);
            a.setEmployee(emp);
            a.setAssignedAt(LocalDateTime.now());
            assignmentRepo.save(a);

            t.setStatus(TaskStatus.ASSIGNED);
            taskRepo.save(t);

            result.put(taskId, empId);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> autoAssign() {
        AssignmentSolution sol = suggest();

        Map<Long, Long> mapping = new LinkedHashMap<>();
        for (var t : sol.getTasks()) {
            mapping.put(t.getTaskId(),
                    t.getAssigned() != null ? t.getAssigned().getEmployeeId() : null);
        }

        Map<Long, Long> committed = commit(mapping);
        long assigned = committed.values().stream().filter(Objects::nonNull).count();

        return Map.of(
                "score", sol.getScore() == null ? "" : sol.getScore().toString(),
                "assignedCount", assigned,
                "totalTasks", committed.size(),
                "mapping", committed
        );
    }

    private PlanningEmployee toPlanningEmployee(Employee e) {
        PlanningEmployee pe = new PlanningEmployee();
        pe.setEmployeeId(e.getId());
        pe.setSkills(extractSkillNames(e));
        pe.setCapacityMinPerDay(480);                  // TODO: fă-l configurabil
        pe.setRecentSpeed(computeRecentSpeed(e.getId()));
        pe.setAvgQuality(computeAvgQuality(e.getId()));
        pe.setLeaves(expandApprovedLeaveDays(e.getId()));
        return pe;
    }

    private PlanningTask toPlanningTask(Task t) {
        PlanningTask pt = new PlanningTask();
        pt.setTaskId(t.getId());
        //pt.setRequiredSkills(parseSkillsJson(t.getRequiredSkillsJson()));
        pt.setDifficulty(nvl(t.getDifficulty(), 3));
        Integer base = (t.getPredictedDurationMin() != null && t.getPredictedDurationMin() > 0)
                ? t.getPredictedDurationMin() : t.getPlannedDurationMin();
        pt.setDurationMin(nvl(base, 60));
        // pt.setDeadline(t.getDeadline());
        pt.setPriority(nvl(t.getPriority(), 3));
        return pt;
    }

    private Set<String> extractSkillNames(Employee e) {
        if (e.getSkills() == null) return Set.of();
        return e.getSkills().stream()                  // List<EmployeeSkill>
                .map(EmployeeSkill::getSkill)          // Skill
                .filter(Objects::nonNull)
                .map(Skill::getName)                   // String
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<String> parseSkillsJson(String json) {
        if (json == null || json.isBlank()) return Set.of();
        try {
            return new HashSet<>(mapper.readValue(json, new TypeReference<List<String>>() {}));
        } catch (Exception ex) {
            return Set.of();
        }
    }

    private Set<LocalDate> expandApprovedLeaveDays(Long employeeId) {
        List<LeaveRequest> intervals = leaveRepo.findApprovedForEmployee(employeeId);
        Set<LocalDate> days = new HashSet<>();
        for (LeaveRequest lr : intervals) {
            LocalDate a = lr.getFromDate();
            LocalDate b = lr.getToDate();
            if (a == null || b == null) continue;
            long n = ChronoUnit.DAYS.between(a, b);
            for (int i = 0; i <= n; i++) days.add(a.plusDays(i));
        }
        return days;
    }

    private double computeRecentSpeed(Long empId) {
        var last = assignmentRepo.findRecentFinished(empId, PageRequest.of(0, 10));
        if (last == null || last.isEmpty()) return 1.0;

        double sum = 0.0; int n = 0;
        for (Assignment a : last) {
            Task t = a.getTask();
            Integer actual = a.getActualDurationMin();
            if (t == null || actual == null || actual <= 0) continue;

            int base = (t.getPredictedDurationMin() != null && t.getPredictedDurationMin() > 0)
                    ? t.getPredictedDurationMin() : nvl(t.getPlannedDurationMin(), 60);

            sum += (double) base / actual;  // >1 = mai rapid decât planul
            n++;
        }
        if (n == 0) return 1.0;
        double avg = sum / n;
        return Math.max(0.5, Math.min(1.5, avg)); // clamp
    }

    private double computeAvgQuality(Long empId) {
        var last = assignmentRepo.findRecentFinished(empId, PageRequest.of(0, 10));
        if (last == null || last.isEmpty()) return 0.8;

        double sum = 0.0; int n = 0;
        for (Assignment a : last) {
            Integer g = a.getAdminGrade();
            if (g == null) continue;
            sum += Math.max(0, Math.min(10, g)) / 10.0;
            n++;
        }
        if (n == 0) return 0.8;
        double avg = sum / n;
        return Math.max(0.5, Math.min(1.0, avg)); // clamp
    }

    private int nvl(Integer v, int def) { return v == null ? def : v; }
}
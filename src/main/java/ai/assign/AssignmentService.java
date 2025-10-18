package ai.assign;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import entity.Assignment;
import entity.Employee;
import entity.EmployeeSkill;
import entity.LeaveRequest;
import entity.Skill;
import entity.Task;
import entity.TaskStatus;
import repository.AssignmentRepository;
import repository.EmployeeRepository;
import repository.LeaveRequestRepository;
import repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final SolverFactory<AssignmentSolution> solverFactory;
    private final EmployeeRepository employeeRepo;
    private final TaskRepository taskRepo;
    private final LeaveRequestRepository leaveRepo;
    private final AssignmentRepository assignmentRepo;

    private final ObjectMapper mapper = new ObjectMapper();

    /** Generează propuneri pentru task-urile cu status NEW */
    @Transactional(readOnly = true)
    public AssignmentSolution suggest() {
        // 1) employees -> PlanningEmployee
        List<PlanningEmployee> employees = employeeRepo.findActive().stream()
                .map(this::toPlanningEmployee)
                .toList();

        // 2) tasks (status NEW) -> PlanningTask
        List<PlanningTask> tasks = taskRepo.findUnassigned().stream()
                .map(this::toPlanningTask)
                .toList();

        // 3) rulează solverul
        AssignmentSolution problem = new AssignmentSolution();
        problem.setEmployees(employees);
        problem.setTasks(tasks);

        Solver<AssignmentSolution> solver = solverFactory.buildSolver();
        return solver.solve(problem);
    }

    /** Persistă propunerile: creează Assignment + marchează Task ca ASSIGNED */
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

            // Creează Assignment (completează câmpurile pe modelul tău)
            Assignment a = new Assignment();
            a.setTask(t);
            a.setEmployee(emp);
            // dacă în Assignment ai Date, schimbă în java.util.Date
            a.setAssignedAt(LocalDateTime.now());
            assignmentRepo.save(a);

            // Marchează task-ul ca ASSIGNED
            t.setStatus(TaskStatus.ASSIGNED);
            taskRepo.save(t);

            result.put(taskId, empId);
        }
        return result;
    }

    // -------------------- mapări & helpers --------------------

    /** Employee (cu EmployeeSkill) -> PlanningEmployee */
    private PlanningEmployee toPlanningEmployee(Employee e) {
        PlanningEmployee pe = new PlanningEmployee();
        pe.setEmployeeId(e.getId());
        pe.setSkills(extractSkillNames(e));
        pe.setCapacityMinPerDay(480);   // TODO: fă-l configurabil
        pe.setRecentSpeed(1.0);         // TODO: calculează din istoricul Assignment (avg base/actual)
        pe.setAvgQuality(0.8);          // TODO: calculează medie notă (grade/10)
        pe.setLeaves(expandApprovedLeaveDays(e.getId()));
        return pe;
    }

    /** Task -> PlanningTask (folosește predicted dacă există, altfel planned) */
    private PlanningTask toPlanningTask(Task t) {
        PlanningTask pt = new PlanningTask();
        pt.setTaskId(t.getId());
        pt.setRequiredSkills(parseSkillsJson(t.getRequiredSkillsJson()));
        pt.setDifficulty(nvl(t.getDifficulty(), 3));
        Integer base = (t.getPredictedDurationMin() != null && t.getPredictedDurationMin() > 0)
                ? t.getPredictedDurationMin() : t.getPlannedDurationMin();
        pt.setDurationMin(nvl(base, 60));
        pt.setDeadline(t.getDeadline());           // poate fi null
        pt.setPriority(nvl(t.getPriority(), 3));
        return pt;
    }

    /** Extrage numele skill-urilor din List<EmployeeSkill> de pe Employee */
    private Set<String> extractSkillNames(Employee e) {
        if (e.getSkills() == null) return Set.of();
        return e.getSkills().stream()                  // List<EmployeeSkill>
                .map(EmployeeSkill::getSkill)          // Skill
                .filter(Objects::nonNull)
                .map(Skill::getName)                   // String
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /** Parsează JSON-ul ["Java","SQL"] din Task.requiredSkillsJson */
    private Set<String> parseSkillsJson(String json) {
        if (json == null || json.isBlank()) return Set.of();
        try {
            return new HashSet<>(mapper.readValue(json, new TypeReference<List<String>>() {}));
        } catch (Exception ex) {
            return Set.of();
        }
    }

    /** Zilele acoperite de concedii aprobate pentru un employee */
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

    private int nvl(Integer v, int def) { return v == null ? def : v; }
}

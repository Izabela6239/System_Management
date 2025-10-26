package com.example.app.managementapi.ManagementApiApplication.ai.assign;

import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/ai/assign")
public class AssignmentController {

    private final AssignmentService service;

    public AssignmentController(AssignmentService service) {
        this.service = service;
    }

    /**
     * Rulează solverul și întoarce sugestia fără să o persiste.
     * Răspuns: { score: "...", taskToEmployee: { taskId: employeeId|null } }
     */
    @PostMapping("/suggest")
    public Map<String, Object> suggest() {
        AssignmentSolution sol = service.suggest();

        Map<Long, Long> mapping = new LinkedHashMap<>();
        for (var t : sol.getTasks()) {
            mapping.put(t.getTaskId(),
                    t.getAssigned() != null ? t.getAssigned().getEmployeeId() : null);
        }

        return Map.of(
                "score", sol.getScore() == null ? "" : sol.getScore().toString(),
                "taskToEmployee", mapping
        );
    }

    /**
     * Primește un mapping { taskId: employeeId } și îl persistă (creează Assignment + setează Task.ASSIGNED).
     * Returnează mappingul final, cu task-urile care chiar au fost persistate (null dacă a eșuat).
     */
    @PostMapping("/commit")
    public Map<Long, Long> commit(@RequestBody Map<Long, Long> taskToEmployee) {
        if (taskToEmployee == null) return Map.of();
        return service.commit(taskToEmployee);
    }

    /**
     * Face suggest + commit într-un singur pas și întoarce un rezumat.
     * Răspuns: { score, assignedCount, totalTasks, mapping }
     */
    @PostMapping("/auto")
    public Map<String, Object> autoAssign() {
        return service.autoAssign();
    }

    /**
     * Endpoint de debug pentru un angajat: calculează aceiași indicatori pe care îi folosește solverul.
     * Îți arată skills, zilele de concediu aprobate, recentSpeed și avgQuality.
     */
    @GetMapping("/debug/employee/{employeeId}")
    public Map<String, Object> debugEmployee(@PathVariable Long employeeId) {
        var sol = service.suggest(); // îl folosim doar ca să reciclăm mapările interne

        // caută PlanningEmployee-ul din soluția curentă (dacă există; altfel întoarce doar id-ul)
        var pe = sol.getEmployees() == null ? null :
                sol.getEmployees().stream()
                        .filter(e -> Objects.equals(e.getEmployeeId(), employeeId))
                        .findFirst()
                        .orElse(null);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("employeeId", employeeId);

        if (pe != null) {
            out.put("skills", pe.getSkills());
            out.put("leaves", pe.getLeaves()); // set de LocalDate
            out.put("recentSpeed", pe.getRecentSpeed());
            out.put("avgQuality", pe.getAvgQuality());
            out.put("capacityMinPerDay", pe.getCapacityMinPerDay());
        } else {
            out.put("message", "Employee nu a fost încărcat în soluția curentă (poate nu este activ).");
        }

        return out;
    }
}

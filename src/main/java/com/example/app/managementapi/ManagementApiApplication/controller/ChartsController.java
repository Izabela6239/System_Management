package com.example.app.managementapi.ManagementApiApplication.controller;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/admin/charts")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ChartsController {

    private final EntityManager em;

    // 1) Workload by day – pentru LineBarCombo
    @GetMapping("/workload-by-day")
    public List<Map<String, Object>> workloadByDay() {
        String jpql = """
            SELECT FUNCTION('DATE', t.deadline),
                   COUNT(t.id),
                   COALESCE(SUM(t.plannedDurationMin), 0)
            FROM Task t
            GROUP BY FUNCTION('DATE', t.deadline)
            ORDER BY FUNCTION('DATE', t.deadline)
        """;

        var q = em.createQuery(jpql, Object[].class);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : q.getResultList()) {
            LocalDate date = row[0] instanceof java.sql.Date d ? d.toLocalDate() : (LocalDate) row[0];
            Long count = (Long) row[1];
            Long durationMin = (Long) row[2];

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("day", date.toString());
            m.put("shipment", count.intValue());
            m.put("delivery", durationMin / 60.0);

            result.add(m);
        }

        return result;
    }


    // 2) Task status distribution – pentru Donut chart
    @GetMapping("/status-distribution")
    public List<Map<String, Object>> statusDistribution() {
        String jpql = """
            SELECT t.status, COUNT(t.id)
            FROM Task t
            GROUP BY t.status
        """;

        var q = em.createQuery(jpql, Object[].class);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : q.getResultList()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", row[0]);
            m.put("value", ((Long) row[1]).intValue());
            result.add(m);
        }

        return result;
    }


    // 3) Assignment progress – pentru ProgressTable
    @GetMapping("/assignments-progress")
    public List<Map<String, Object>> assignmentsProgress() {
        String jpql = """
            SELECT a.id, a.employee.id, t.id,
                   a.assignedAt, a.startedAt, a.finishedAt,
                   t.deadline, t.plannedDurationMin,
                   a.valid
            FROM Assignment a
            JOIN a.task t
        """;

        var q = em.createQuery(jpql, Object[].class);

        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Object[] r : q.getResultList()) {
            Long assignmentId = (Long) r[0];
            Long empId = (Long) r[1];
            Long taskId = (Long) r[2];
            LocalDateTime assignedAt = (LocalDateTime) r[3];
            LocalDateTime startedAt = (LocalDateTime) r[4];
            LocalDateTime finishedAt = (LocalDateTime) r[5];
            LocalDateTime deadline = (LocalDateTime) r[6];
            Integer planned = (Integer) r[7];
            Boolean valid = (Boolean) r[8];

            if (valid != null && !valid) continue;

            int progress;
            String warning;

            if (finishedAt != null) {
                progress = 100;
                warning = "Completed";
            } else if (deadline != null && deadline.isBefore(now)) {
                progress = 90;
                warning = "Overdue";
            } else if (startedAt != null && planned != null && planned > 0) {
                long passed = ChronoUnit.MINUTES.between(startedAt, now);
                progress = (int) Math.min(100, (passed * 100.0 / planned));
                warning = "In progress";
            } else {
                progress = 10;
                warning = "Assigned";
            }

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", "Task #" + taskId + " / Emp #" + empId);
            m.put("start", assignedAt != null ? assignedAt.toString() : "-");
            m.put("end", deadline != null ? deadline.toString() : "-");
            m.put("warning", warning);
            m.put("progress", progress);

            result.add(m);
        }

        return result.size() > 10 ? result.subList(0, 10) : result;
    }
}

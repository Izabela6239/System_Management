package ai.scoring;

import jakarta.persistence.EntityManager;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/ai/metrics")
public class MetricsController {

    private final EntityManager em;
    private final ScoringService scoring;

    // 🔹 Constructor explicit pentru injecție
    public MetricsController(EntityManager em, ScoringService scoring) {
        this.em = em;
        this.scoring = scoring;
    }

    @GetMapping("/productivity")
    public List<Map<String, Object>> productivity(@RequestParam String period,
                                                  @RequestParam(required = false) Long employeeId) {

        String jpql = """
            SELECT a.id, t.id, a.employee.id, t.plannedDurationMin, t.predictedDurationMin,
                   a.actualDurationMin, a.adminGrade, t.difficulty,
                   t.revenue, t.otherCosts, a.finishedAt, a.employee.hourlyRate
            FROM Assignment a
            JOIN a.task t
            WHERE FUNCTION('DATE_FORMAT', a.finishedAt, '%Y-%m') = :period
        """ + (employeeId != null ? " AND a.employee.id = :eid" : "");

        var q = em.createQuery(jpql, Object[].class).setParameter("period", period);
        if (employeeId != null) q.setParameter("eid", employeeId);

        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : q.getResultList()) {
            Long assignmentId = (Long) r[0];
            Long taskId       = (Long) r[1];
            Long empId        = (Long) r[2];
            Integer planned   = (Integer) r[3];
            Integer predicted = (Integer) r[4];
            Integer actual    = (Integer) r[5];
            Integer grade     = (Integer) r[6];
            Integer diff      = (Integer) r[7];
            BigDecimal revenue    = (BigDecimal) r[8];
            BigDecimal otherCosts = (BigDecimal) r[9];
            BigDecimal hourlyRate = (BigDecimal) r[11];

            double prod = scoring.productivityScore(planned, predicted, actual, grade, diff);
            BigDecimal prof = scoring.profit(revenue, hourlyRate, actual, otherCosts);

            Map<String,Object> m = new LinkedHashMap<>();
            m.put("assignmentId", assignmentId);
            m.put("taskId", taskId);
            m.put("employeeId", empId);
            m.put("productivity", prod);
            m.put("profit", prof);
            m.put("explain", Map.of(
                    "speed", String.format("%s/%s min",
                            (predicted != null && predicted > 0 ? predicted : planned), actual),
                    "quality", grade == null ? 0 : grade / 10.0,
                    "difficulty", diff == null ? 3 : diff
            ));
            out.add(m);
        }
        return out;
    }
}

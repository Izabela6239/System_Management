package ai.assign;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/ai/assign")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService service;

    @PostMapping("/suggest")
    public Map<String, Object> suggest() {
        AssignmentSolution sol = service.suggest();
        Map<Long, Long> map = new LinkedHashMap<>();
        for (var t : sol.getTasks()) {
            map.put(t.getTaskId(), t.getAssigned()!=null ? t.getAssigned().getEmployeeId() : null);
        }
        return Map.of(
                "score", sol.getScore()==null? "" : sol.getScore().toString(),
                "taskToEmployee", map
        );
    }

    @PostMapping("/commit")
    public Map<Long, Long> commit(@RequestBody Map<Long, Long> taskToEmployee) {
        return service.commit(taskToEmployee);
    }
}

package ai.assign;

import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.solver.SolverConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class OptaPlannerConfig {
    @Bean
    public SolverFactory<AssignmentSolution> solverFactory() {
        return SolverFactory.create(new SolverConfig()
                .withSolutionClass(AssignmentSolution.class)
                .withEntityClasses(PlanningTask.class)
                .withConstraintProviderClass(AssignmentConstraintProvider.class)
                .withTerminationSpentLimit(Duration.ofSeconds(2))
        );
    }
}

package ai.assign;

import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.solver.EnvironmentMode;
import org.optaplanner.core.config.solver.SolverConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OptaPlannerConfig {

    @Bean
    public SolverFactory<AssignmentSolution> solverFactory() {
        SolverConfig cfg = new SolverConfig()
                .withSolutionClass(AssignmentSolution.class)
                .withEntityClasses(PlanningTask.class)
                .withEnvironmentMode(EnvironmentMode.REPRODUCIBLE)
                .withTerminationConfig(
                        new org.optaplanner.core.config.solver.termination.TerminationConfig()
                                .withSecondsSpentLimit(2L)
                );

        return SolverFactory.create(cfg);
    }
}

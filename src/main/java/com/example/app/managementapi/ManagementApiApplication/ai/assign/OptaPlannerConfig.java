package com.example.app.managementapi.ManagementApiApplication.ai.assign;

import com.example.app.managementapi.ManagementApiApplication.ai.assign.AssignmentConstraintProvider;
import com.example.app.managementapi.ManagementApiApplication.ai.assign.AssignmentSolution;
import com.example.app.managementapi.ManagementApiApplication.ai.assign.PlanningTask;
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
                .withConstraintProviderClass(AssignmentConstraintProvider.class) // ADAUGĂ ASTA
                .withEnvironmentMode(EnvironmentMode.REPRODUCIBLE)
                .withTerminationConfig(
                        new org.optaplanner.core.config.solver.termination.TerminationConfig()
                                .withSecondsSpentLimit(2L)
                );

        return SolverFactory.create(cfg);
    }
}
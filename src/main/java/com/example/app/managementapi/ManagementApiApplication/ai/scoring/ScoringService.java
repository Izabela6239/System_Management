package com.example.app.managementapi.ManagementApiApplication.ai.scoring;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class ScoringService {

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    public double productivityScore(
            Integer plannedMin, Integer predictedMin, Integer actualMin,
            Integer grade0to10, Integer difficulty1to5) {

        if (actualMin == null || actualMin <= 0) return 0.0;
        int base = (predictedMin != null && predictedMin > 0)
                ? predictedMin : (plannedMin != null ? plannedMin : 0);
        if (base <= 0) return 0.0;

        double speed = clamp((double) base / actualMin, 0.5, 2.0);
        double quality = clamp((grade0to10 == null ? 0 : grade0to10) / 10.0, 0.0, 1.0);
        int diff = (difficulty1to5 == null ? 3 : difficulty1to5);
        double diffW = 1.0 + 0.2 * (diff - 3);
        return speed * quality * diffW;
    }

    public BigDecimal profit(BigDecimal revenue, BigDecimal hourlyRate,
                             Integer actualMin, BigDecimal otherCosts) {
        BigDecimal rev = revenue == null ? BigDecimal.ZERO : revenue;
        BigDecimal other = otherCosts == null ? BigDecimal.ZERO : otherCosts;
        BigDecimal labor = (hourlyRate == null || actualMin == null)
                ? BigDecimal.ZERO
                : hourlyRate.multiply(BigDecimal.valueOf(actualMin / 60.0));
        return rev.subtract(labor).subtract(other);
    }
}

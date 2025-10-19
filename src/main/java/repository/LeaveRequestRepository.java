package repository;

import entity.LeaveRequest;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    @Query("""
      SELECT lr FROM LeaveRequest lr
      WHERE lr.employee.id = :employeeId
        AND lr.status = entity.LeaveStatus.APPROVED
    """)
    List<LeaveRequest> findApprovedForEmployee(Long employeeId);

    // Helper de conveniență: extinde intervalele în set de zile
    default Set<LocalDate> expandApprovedDays(Long employeeId) {
        List<LeaveRequest> intervals = findApprovedForEmployee(employeeId);
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
}

package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.Assignment;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.LeaveStatus;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.enums.UserRole;
import com.example.app.managementapi.ManagementApiApplication.repository.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.AssignmentRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.LeaveRequestRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final AssignmentRepository assignmentRepository;
    private final PasswordEncoder passwordEncoder;

    /* ===================== LEAVE REQUESTS ===================== */

    public LeaveRequest createLeaveRequest(LeaveRequestDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setFromDate(dto.getFromDate());
        leaveRequest.setToDate(dto.getToDate());
        leaveRequest.setReason(dto.getReason());

        if (dto.getAdminId() != null) {
            Admin admin = adminRepository.findById(dto.getAdminId())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));
            leaveRequest.setAdmin(admin);
        }

        leaveRequest.setStatus(dto.getStatus() != null ? dto.getStatus() : LeaveStatus.PENDING);
        leaveRequest.setAdminComment(dto.getAdminComment());

        return leaveRequestRepository.save(leaveRequest);
    }

    public List<LeaveRequest> getLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    public List<LeaveRequest> getApprovedLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, LeaveStatus.APPROVED);
    }

    public List<LeaveRequest> getPendingLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, LeaveStatus.PENDING);
    }

    public List<LeaveRequest> getRejectedLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, LeaveStatus.REJECTED);
    }

    /* ===================== TASKS ===================== */

    public List<Task> getAllTasks(Long employeeId) {
        return taskRepository.findTasksByEmployeeId(employeeId);
    }

    public List<Task> getTasksByStatus(Long employeeId, TaskStatus status) {
        return taskRepository.findTasksByEmployeeIdAndStatus(employeeId, status);
    }

    public Task updateTask(Long taskId, TaskStatus status, Integer plannedDurationMin) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (status != null) task.setStatus(status);
        if (plannedDurationMin != null) task.setPlannedDurationMin(plannedDurationMin);

        return taskRepository.save(task);
    }

    public boolean isTaskAssignedToEmployee(Long taskId, Long employeeId) {
        return taskRepository.isTaskAssignedToEmployee(taskId, employeeId);
    }

    public List<Task> getTasksInProgress(Long employeeId) {
        return getTasksByStatus(employeeId, TaskStatus.IN_PROGRESS);
    }

    public List<Task> getCompletedTasks(Long employeeId) {
        return getTasksByStatus(employeeId, TaskStatus.DONE);
    }

    /* ===================== USERS / EMPLOYEES ===================== */

    public Long getEmployeeIdFromUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not an employee");
        }
        return user.getEmployeeId();
    }

    public Employee getEmployeeByUserId(Long userId) {
        Long employeeId = getEmployeeIdFromUserId(userId);
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    public List<User> getAllEmployees() {
        return userRepository.findAll()
                .stream()
                .filter(User::isEmployee)
                .toList();
    }

    public User createEmployee(User employee) {
        employee.setRole(UserRole.EMPLOYEE);
        employee.setActive(true);
        if (employee.getPassword() != null && !employee.getPassword().isBlank()) {
            employee.setPassword(passwordEncoder.encode(employee.getPassword()));
        } else {
            employee.setPassword(passwordEncoder.encode("changeme"));
        }
        return userRepository.save(employee);
    }

    public User updateEmployee(Long id, User updated) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (updated.getUsername()   != null) existing.setUsername(updated.getUsername());
        if (updated.getActive()     != null) existing.setActive(updated.getActive());
        if (updated.getRole()       != null) existing.setRole(updated.getRole());
        if (updated.getAdminId()    != null) existing.setAdminId(updated.getAdminId());
        if (updated.getEmployeeId() != null) existing.setEmployeeId(updated.getEmployeeId());

        if (updated.getPassword() != null && !updated.getPassword().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(updated.getPassword()));
        }

        return userRepository.save(existing);
    }

    public void deleteEmployee(Long id) {
        userRepository.deleteById(id);
    }

    /* ===================== SALARY (simplu/lunar) ===================== */
    /**
     * Calculează salariul pe baza assignment-urilor **finalizate** în luna dată.
     * Durata o luăm din `task.planned_duration_min` dacă nu ai durată reală.
     */
   /* public double computeSalary(Long employeeId, YearMonth ym) {
        double hourlyRate = 50.0; // exemplu
        var finished = assignmentRepository
                .findByEmployeeIdAndFinishedAtYearMonth(employeeId, ym.getMonthValue());

        int totalMinutes = 0;
        for (Assignment a : finished) {
            Task t = a.getTask();
            Integer m = (t.getPlannedDurationMin() != null)
                    ? t.getPlannedDurationMin()
                    : (t.getPredictedDurationMin() != null ? t.getPredictedDurationMin() : 0);
            totalMinutes += m;
        }
        double hours = totalMinutes / 60.0;
        return hours * hourlyRate;
    }*/

    /* ===================== XML IMPORT ===================== */

    /**
     * Importă angajați din XML. Acceptă doar câmpurile existente pe User: username, password, active.
     * Schema:
     * <employees>
     *   <employee>
     *     <username>john.smith</username>
     *     <password>secret</password>    <!-- opțional; dacă lipsește, punem "changeme" -->
     *     <active>true</active>          <!-- opțional -->
     *   </employee>
     * </employees>
     */
    public List<User> importEmployeesXml(MultipartFile file) {
        List<User> created = new ArrayList<>();
        try (InputStream is = file.getInputStream()) {
            // Secure DOM (XXE off)
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
            dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            dbf.setXIncludeAware(false);
            dbf.setExpandEntityReferences(false);

            DocumentBuilder db = dbf.newDocumentBuilder();
            Document doc = db.parse(is);
            doc.getDocumentElement().normalize();

            NodeList list = doc.getElementsByTagName("employee");
            List<User> toSave = new ArrayList<>();

            for (int i = 0; i < list.getLength(); i++) {
                Element e = (Element) list.item(i);

                String username = trim(text(e, "username"));
                String password = trim(text(e, "password"));
                String active   = trim(text(e, "active")); // "true"/"false" opțional

                if (username == null || username.isBlank()) continue;
                if (userRepository.findByUsername(username).isPresent()) continue;

                User u = new User();
                u.setUsername(username);
                u.setRole(UserRole.EMPLOYEE);
                u.setActive(active != null ? Boolean.parseBoolean(active) : true);
                u.setPassword(passwordEncoder.encode(
                        (password != null && !password.isBlank()) ? password : "changeme"
                ));
                toSave.add(u);
            }

            if (!toSave.isEmpty()) created = userRepository.saveAll(toSave);
        } catch (Exception ex) {
            throw new RuntimeException("Invalid XML payload", ex);
        }
        return created;
    }

    /* ===================== helpers ===================== */

    private static String text(Element parent, String tag) {
        NodeList nl = parent.getElementsByTagName(tag);
        if (nl.getLength() == 0) return null;
        Node n = nl.item(0);
        return n != null ? n.getTextContent() : null;
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
}

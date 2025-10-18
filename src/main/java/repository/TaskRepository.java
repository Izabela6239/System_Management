package repository;

import entity.Task;
import entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Prefer această variantă (evită JPQL cu enum fully-qualified):
    List<Task> findByStatus(TaskStatus status);

    // Alternativ (dacă vrei un singur call pregătit):
    default List<Task> findUnassigned() {
        return findByStatus(TaskStatus.NEW);
    }
}

import { useEffect, useState } from "react";
import { getTasks, updateTask, Task } from "../services/EmployeeService";

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        getTasks().then(setTasks);
    }, []);

    const handleUpdate = async () => {
        if (!selectedTask) return;
        await updateTask(selectedTask.id, selectedTask.status, selectedTask.plannedDurationMin);
        alert("Task updated");
        getTasks().then(setTasks);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl mb-4">Manage Tasks</h1>

            <table className="table">
                <thead>
                <tr><th>ID</th><th>Title</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                {tasks.map(task => (
                    <tr key={task.id}>
                        <td>{task.id}</td>
                        <td>{task.title}</td>
                        <td>{task.status}</td>
                        <td><button onClick={() => setSelectedTask(task)}>Edit</button></td>
                    </tr>
                ))}
                </tbody>
            </table>

            {selectedTask && (
                <div className="mt-6 p-4 border rounded">
                    <h3>Edit Task {selectedTask.id}</h3>
                    <label>Status:</label>
                    <input
                        value={selectedTask.status}
                        onChange={e => setSelectedTask({...selectedTask, status: e.target.value as any})}
                        className="input"
                    />
                    <label>Planned Duration:</label>
                    <input
                        type="number"
                        value={selectedTask.plannedDurationMin || ""}
                        onChange={e => setSelectedTask({...selectedTask, plannedDurationMin: Number(e.target.value)})}
                        className="input"
                    />
                    <button onClick={handleUpdate} className="btn mt-2">Save</button>
                </div>
            )}
        </div>
    );
}

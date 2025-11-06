import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/DashboardPage";
import TasksPage from "./pages/TaskPage";
import LeavePage from "./pages/LeavePage";
import CreateLeavePage from "./pages/CreateLeavePage";
function App() {
    return (
        <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employee/tasks" element={<TasksPage />} />
                <Route path="/employee/leave" element={<LeavePage />} />
                <Route path="/employee/leave/new" element={<CreateLeavePage />} />

        </Routes>
    );
}

export default App;

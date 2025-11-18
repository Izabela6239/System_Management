// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/DashboardPage";
import TasksPage from "./pages/TaskPage";
import LeavePage from "./pages/LeavePage";
import CreateLeavePage from "./pages/CreateLeavePage";

import AdminDashboard from "./pages/AdminDashboard";
import RequireAuth from "./routes/RequireAuth";
import RequireRole from "./routes/RequireRole";
import EmployeeDashboard from "./pages/EmployeeDashboard";

function App() {
    return (
        <Routes>
            {/* public */}
            <Route path="/login" element={<Login />} />

            {/* EMPLOYEE DASHBOARD */}
            <Route
                path="/employee"
                element={
                    <RequireRole role="EMPLOYEE">
                        <EmployeeDashboard />
                    </RequireRole>
                }
            />

            {/* admin area */}
            <Route
                path="/admin"
                element={
                    <RequireRole role="ADMIN">
                        <AdminDashboard />
                    </RequireRole>
                }
            />

            {/* redirect root -> login sau dashboard (după preferință) */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 */}
            <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
        </Routes>
    );
}

export default App;

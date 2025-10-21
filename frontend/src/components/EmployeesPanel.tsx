import React from "react";
import DashboardCard from "./DashboardCard";

export default function EmployeesPanel() {
    return (
        <div className="row">
            <DashboardCard title="Total Employees" value="25" icon="users" color="primary" />
            <DashboardCard title="Active" value="20" icon="user-check" color="success" />
            <DashboardCard title="On Leave" value="3" icon="user-minus" color="warning" />
            <DashboardCard title="New Hires" value="2" icon="user-plus" color="info" />
        </div>
    );
}

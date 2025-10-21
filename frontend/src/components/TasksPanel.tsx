import React from "react";
import DashboardCard from "./DashboardCard";

export default function TasksPanel() {
    return (
        <div className="row mt-2">
            <DashboardCard title="Total Tasks" value="42" icon="checklist" color="primary" />
            <DashboardCard title="Completed" value="27" icon="check" color="success" />
            <DashboardCard title="In Progress" value="10" icon="progress" color="info" />
            <DashboardCard title="Delayed" value="5" icon="alert-triangle" color="danger" />
        </div>
    );
}

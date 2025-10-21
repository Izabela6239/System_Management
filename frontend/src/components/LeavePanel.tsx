import React from "react";
import DashboardCard from "./DashboardCard";

export default function LeavePanel() {
    return (
        <div className="row mt-2">
            <DashboardCard title="Total Requests" value="18" icon="calendar" color="primary" />
            <DashboardCard title="Approved" value="10" icon="thumb-up" color="success" />
            <DashboardCard title="Pending" value="5" icon="clock" color="warning" />
            <DashboardCard title="Rejected" value="3" icon="thumb-down" color="danger" />
        </div>
    );
}

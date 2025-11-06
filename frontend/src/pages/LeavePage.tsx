import { useEffect, useState } from "react";
import { getLeaveRequests, LeaveRequest } from "../services/EmployeeService";

export default function LeavePage() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

    useEffect(() => {
        getLeaveRequests().then(setLeaves);
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl mb-4">Leave Requests</h1>
            <table className="table">
                <thead>
                <tr><th>ID</th><th>Dates</th><th>Reason</th><th>Status</th></tr>
                </thead>
                <tbody>
                {leaves.map(l => (
                    <tr key={l.id}>
                        <td>{l.id}</td>
                        <td>{l.fromDate} → {l.toDate}</td>
                        <td>{l.reason}</td>
                        <td>{l.status}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

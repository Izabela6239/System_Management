import { useEffect, useState } from "react";
import { getPendingLeaveRequests } from "../services/EmployeeService";
import { approveLeave, rejectLeave } from "../services/AdminService";
import ProgressTable from "../components/tables/ProgressTable";

export default function LeavesPageAdmin() {
    const [rows, setRows] = useState<any[]>([]);
    const load = async () => setRows(await getPendingLeaveRequests());
    useEffect(()=>{ load(); }, []);

    const onApprove = async (id:number) => { await approveLeave(id); await load(); };
    const onReject = async (id:number) => { const c = prompt("comentariu?")||undefined; await rejectLeave(id, c); await load(); };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending leave requests</h2>
            <ProgressTable rows={rows.map((l:any)=>({
                code: String(l.id),
                start: `${l.fromDate} → ${l.toDate}`,
                end: l.status,
                warning: l.reason ?? "",
                progress: 50,
                actions: [
                    { label: "Approve", onClick: () => onApprove(l.id) },
                    { label: "Reject", onClick: () => onReject(l.id) },
                ]
            }))}/>
        </div>
    );
}

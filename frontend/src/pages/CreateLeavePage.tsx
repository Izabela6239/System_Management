import { useState } from "react";
import { createLeaveRequest } from "../services/EmployeeService";

export default function CreateLeavePage() {
    const [form, setForm] = useState({
        fromDate: "",
        toDate: "",
        reason: ""
    });

    const submit = async () => {
        await createLeaveRequest(form);
        alert("Leave created!");
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl mb-4">Create Leave</h1>

            <label>From Date</label>
            <input type="date" className="input" value={form.fromDate}
                   onChange={e => setForm({...form, fromDate: e.target.value})}/>

            <label>To Date</label>
            <input type="date" className="input" value={form.toDate}
                   onChange={e => setForm({...form, toDate: e.target.value})}/>

            <label>Reason</label>
            <input className="input" value={form.reason}
                   onChange={e => setForm({...form, reason: e.target.value})}/>

            <button className="btn mt-4" onClick={submit}>Create</button>
        </div>
    );
}

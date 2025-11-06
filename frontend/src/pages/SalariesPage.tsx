import { useState } from "react";
import { computeSalary } from "../services/AdminService";

export default function SalariesPage() {
    const [val, setVal] = useState<number | null>(null);

    const onCompute = async () => {
        const employeeId = Number(prompt("employee id?"));
        const year = Number(prompt("year?"));
        const month = Number(prompt("month (1-12)?"));
        if (!employeeId || !year || !month) return;
        const { data } = await computeSalary(employeeId, year, month);
        setVal(data ?? 0);
    };

    return (
        <div className="space-y-4">
            <button className="btn" onClick={onCompute}>Compute salary…</button>
            {val !== null && <div className="p-4 rounded bg-gray-100">Salary: <b>{val}</b></div>}
        </div>
    );
}

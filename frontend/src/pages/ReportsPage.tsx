import { useState } from "react";
import { getMonthlyKpi } from "../services/AdminService";
import Donut from "../components/charts/Donut";
import LineBarCombo from "../components/charts/LineBarCombo";

export default function ReportsPage() {
    const [data, setData] = useState<any|null>(null);

    const load = async () => {
        const employeeId = Number(prompt("employee id?"));
        const year = Number(prompt("year?"));
        const month = Number(prompt("month (1-12)?"));
        if (!employeeId || !year || !month) return;
        const { data: res } = await getMonthlyKpi(employeeId, year, month);
        setData(res);
    };

    return (
        <div className="space-y-6">
            <button className="btn" onClick={load}>Load KPI…</button>
            {data && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <LineBarCombo data={[
                                { name: "Completed", progress: data.completedTasks ?? 0 },
                                { name: "Total",     progress: data.totalTasks ?? 0 },
                            ]}/>
                        </div>
                        <Donut data={[
                            { name: "Completed", value: data.completedTasks ?? 0 },
                            { name: "Remaining", value: Math.max((data.totalTasks ?? 0) - (data.completedTasks ?? 0), 0) },
                        ]}/>
                    </div>
                </>
            )}
        </div>
    );
}

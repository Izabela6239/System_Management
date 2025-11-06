import { useEffect, useState } from "react";
import { getUnassignedTasks, getMyTasks } from "@/services/AdminService";
import { setTaskPresetDuration, setTaskDifficulty, finalizeTask } from "@/services/AdminService";
import ProgressTable from "@/components/tables/ProgressTable";

export default function TasksPageAdmin() {
    const [tasks, setTasks] = useState<any[]>([]);
    const load = async () => setTasks(await getUnassignedTasks()); // sau orice listă de task-uri admin
    useEffect(()=>{ load(); }, []);

    const onPreset = async () => {
        const id = Number(prompt("task id?"));
        const min = Number(prompt("preset minutes?"));
        if (!id || !min) return;
        await setTaskPresetDuration(id, min);
        await load();
    };
    const onDifficulty = async () => {
        const id = Number(prompt("task id?"));
        const level = Number(prompt("difficulty 1..5?"));
        if (!id || !level) return;
        await setTaskDifficulty(id, level);
        await load();
    };
    const onFinalize = async () => {
        const id = Number(prompt("task id?"));
        const actual = Number(prompt("actual minutes?"));
        const gradeStr = prompt("grade (1..10) optional");
        const profitStr = prompt("profit optional");
        const grade = gradeStr ? Number(gradeStr) : undefined;
        const profit = profitStr ? Number(profitStr) : undefined;
        if (!id || !actual) return;
        await finalizeTask(id, actual, grade, profit);
        await load();
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button className="btn" onClick={onPreset}>Set preset duration</button>
                <button className="btn" onClick={onDifficulty}>Set difficulty</button>
                <button className="btn" onClick={onFinalize}>Finalize (grade/profit)</button>
                <button className="btn" onClick={load}>Refresh</button>
            </div>
            <ProgressTable rows={tasks.map((t:any)=>({
                code: String(t.id),
                start: t.title,
                end: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                warning: `diff:${t.difficulty ?? "-"} grade:${t.grade ?? "-"} profit:${t.profit ?? "-"}`,
                progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20
            }))}/>
        </div>
    );
}

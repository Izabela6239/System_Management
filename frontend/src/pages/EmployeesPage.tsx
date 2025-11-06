import { useEffect, useState } from "react";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, importEmployeesXml } from "../services/AdminService";
import ProgressTable from "../components/tables/ProgressTable";

export default function EmployeesPage() {
    const [rows, setRows] = useState<any[]>([]);
    const load = async () => setRows(await getEmployees());
    useEffect(() => { load(); }, []);

    const onCreate = async () => {
        const username = prompt("username?");
        if (!username) return;
        await createEmployee({ username });
        await load();
    };
    const onUpdate = async () => {
        const id = Number(prompt("employee id?"));
        if (!id) return;
        const username = prompt("new username?");
        await updateEmployee(id, { username: username || undefined });
        await load();
    };
    const onDelete = async () => {
        const id = Number(prompt("employee id?"));
        if (!id) return;
        await deleteEmployee(id);
        await load();
    };
    const onImportXml = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await importEmployeesXml(file);
        await load();
        alert("Imported");
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 items-center">
                <button className="btn" onClick={onCreate}>Add</button>
                <button className="btn" onClick={onUpdate}>Edit</button>
                <button className="btn" onClick={onDelete}>Delete</button>
                <label className="btn cursor-pointer">
                    Import XML
                    <input type="file" accept=".xml" onChange={onImportXml} hidden />
                </label>
                <button className="btn" onClick={load}>Refresh</button>
            </div>
            <ProgressTable rows={rows.map((e:any)=>({
                code: String(e.id),
                start: e.username ?? e.name,
                end: e.email ?? "",
                warning: "",
                progress: 100
            }))}/>
        </div>
    );
}

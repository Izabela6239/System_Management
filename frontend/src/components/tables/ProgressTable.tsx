type Row = { code:string; start:string; end:string; warning:string; progress:number };
export default function ProgressTable({rows}:{rows:Row[]}) {
    return (
        <div className="bg-vx-card rounded-2xl shadow-vx p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">On route vehicles</h3>
                <div className="text-sm text-vx-subt">Showing {rows.length} entries</div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-vx-subt">
                    <tr className="[&>th]:text-left [&>th]:py-3">
                        <th>Location</th><th>Starting Route</th><th>Ending Route</th><th>Warnings</th><th>Progress</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                    {rows.map((r,i)=>(
                        <tr key={i} className="[&>td]:py-3">
                            <td className="font-medium">{r.code}</td>
                            <td>{r.start}</td>
                            <td>{r.end}</td>
                            <td><span className="px-2 py-1 rounded-full bg-vx-bg text-vx-subt">{r.warning}</span></td>
                            <td>
                                <div className="h-2 w-40 bg-vx-bg rounded-full overflow-hidden">
                                    <div className="h-full bg-vx-primary" style={{width:`${r.progress}%`}}/>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

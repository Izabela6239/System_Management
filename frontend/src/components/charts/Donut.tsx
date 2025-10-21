import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#22c55e','#38bdf8','#f59e0b','#ef4444','#a78bfa'];

export default function Donut({data}:{data:{name:string,value:number}[]}){
    const total = data.reduce((s,d)=>s+d.value,0);
    const pct = Math.round((data[0]?.value || 0) * 100 / (total || 1));
    return (
        <div className="bg-vx-card rounded-2xl shadow-vx p-5">
            <h3 className="font-semibold mb-4">Delivery Exceptions (AI)</h3>
            <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip/>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                            {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center -mt-72 pointer-events-none">
                <div className="inline-flex w-32 h-32 rounded-full items-center justify-center">
                    <div>
                        <div className="text-2xl font-semibold">{pct}%</div>
                        <div className="text-xs text-vx-subt">AVG. Exceptions</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

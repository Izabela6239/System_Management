import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function LineBarCombo({data}:{data:any[]}){
    return (
        <div className="bg-vx-card rounded-2xl shadow-vx p-5">
            <h3 className="font-semibold mb-4">Shipment Statistics (AI)</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="day"/>
                        <YAxis/>
                        <Tooltip/>
                        <Bar dataKey="shipment" barSize={24} />
                        <Line type="monotone" dataKey="delivery" strokeWidth={2}/>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

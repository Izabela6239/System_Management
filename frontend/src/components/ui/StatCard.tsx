type Props = { title:string; value:string|number; trend?:string; dotClass?:string };
export default function StatCard({ title, value, trend, dotClass="bg-vx-accent" }:Props){
    return (
        <div className="bg-vx-card rounded-2xl shadow-vx p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs uppercase text-vx-subt">{title}</p>
                    <p className="text-2xl font-semibold mt-1">{value}</p>
                    {trend && <p className="text-xs mt-1 text-vx-subt">{trend}</p>}
                </div>
                <span className={`inline-block w-3 h-3 rounded-full ${dotClass}`}/>
            </div>
        </div>
    );
}
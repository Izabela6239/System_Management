import StatCard from '../components/ui/StatCard';
import LineBarCombo from '../components/charts/LineBarCombo';
import Donut from '../components/charts/Donut';
import ProgressTable from '../components/tables/ProgressTable';


const shipmentData = [
    { day:'1 Jan', shipment: 35, delivery: 22 },
    { day:'2 Jan', shipment: 42, delivery: 27 },
    { day:'3 Jan', shipment: 31, delivery: 23 },
    { day:'4 Jan', shipment: 36, delivery: 30 },
    { day:'5 Jan', shipment: 29, delivery: 25 },
    { day:'6 Jan', shipment: 48, delivery: 40 },
    { day:'7 Jan', shipment: 45, delivery: 32 },
    { day:'8 Jan', shipment: 33, delivery: 35 },
    { day:'9 Jan', shipment: 38, delivery: 24 },
    { day:'10 Jan', shipment: 25, delivery: 31 },
];

const donutData = [
    { name:'Incorrect address', value: 30 },
    { name:'Weather conditions', value: 20 },
    { name:'Federal Holidays', value: 25 },
    { name:'Damage during transit', value: 15 },
    { name:'Other', value: 10 },
];

const rows = [
    { code:'VOL-159145', start:'Paris, FR', end:'Dresden, DE', warning:'No Warnings', progress:60 },
    { code:'VOL-182964', start:'Saintes, FR', end:'Roma, IT', warning:'Fuel Problems', progress:82 },
    { code:'VOL-276904', start:'Aulnay-sous-Bois, FR', end:'Torino, IT', warning:'Temperature Not Optimal', progress:30 },
    { code:'VOL-300198', start:'West Palm Beach, USA', end:'Dresden, DE', warning:'ECU Not Responding', progress:90 },
    { code:'VOL-302781', start:'Köln, DE', end:'La Spezia, IT', warning:'Oil Leakage', progress:24 },
];

export default function Dashboard(){
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard title="Total Employees" value={25}/>
                <StatCard title="Active" value={20}/>
                <StatCard title="On Leave" value={3} dotClass="bg-cyan-400"/>
                <StatCard title="Total Tasks" value={42}/>
                <StatCard title="Completed" value={27}/>
                <StatCard title="New Hires" value={2} dotClass="bg-orange-400"/>
                <StatCard title="In Progress" value={10}/>
                <StatCard title="Pending" value={5}/>
                <StatCard title="Delayed" value={5} dotClass="bg-vx-warn"/>
                <StatCard title="Requests" value={18}/>
                <StatCard title="Approved" value={10} dotClass="bg-vx-accent"/>
                <StatCard title="Rejected" value={3} dotClass="bg-vx-danger"/>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2"><LineBarCombo data={shipmentData}/></div>
                <Donut data={donutData}/>
            </div>

            {/* Table */}
            <ProgressTable rows={rows}/>
        </div>
    );
}

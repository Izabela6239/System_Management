import React from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

export default function AIChartsPanel() {
    const shipmentSeries = [
        { name: "Shipment", type: "column" as const, data: [38,45,33,38,32,50,48,40,42,37] },
        { name: "Delivery", type: "line"   as const, data: [23,28,23,32,28,44,32,38,26,34] }
    ];

    const shipmentOptions: ApexOptions = {
        chart: { height: 320, type: "line", stacked: false, toolbar: { show: false }, parentHeightOffset: 0, zoom: { enabled: false } },
        markers: { size: 5, strokeColors: "#7367F0", hover: { size: 6 } },
        stroke: { curve: "smooth", width: [0, 3] },
        legend: { position: "bottom", offsetY: 8 },
        grid: { strokeDashArray: 8 },
        colors: ["#FFC107", "#7367F0"],
        fill: { opacity: [1, 1] },
        plotOptions: { bar: { columnWidth: "30%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        xaxis: { categories: ['1 Jan','2 Jan','3 Jan','4 Jan','5 Jan','6 Jan','7 Jan','8 Jan','9 Jan','10 Jan'] },
        yaxis: { min: 0, max: 50, tickAmount: 4, labels: { formatter: (v) => `${v}%` } }
    };

    const donutSeries = [13, 25, 22, 40]; // doar number[]

    const donutOptions: ApexOptions = {
        chart: { type: "donut", height: 391 },
        labels: ["Incorrect address", "Weather conditions", "Federal Holidays", "Damage during transit"],
        stroke: { width: 0 },
        dataLabels: { enabled: false },
        legend: { position: "bottom", offsetY: 15, markers: { size: 8, offsetX: -3 } },
        plotOptions: {
            pie: {
                donut: {
                    size: "77%",
                    labels: {
                        show: true,
                        value: { fontSize: "24px", offsetY: -20, formatter: (val) => `${parseInt(val as any, 10)}%` },
                        name: { offsetY: 30 },
                        total: { show: true, label: "AVG. Exceptions", formatter: () => "30%" }
                    }
                }
            }
        }
    };

    return (
        <div className="row g-6">
            <div className="col-xl-8 col-12">
                <div className="card">
                    <div className="card-header"><h4 className="card-title m-0">Shipment Statistics (AI)</h4></div>
                    <div className="card-body">
                        <ReactApexChart options={shipmentOptions} series={shipmentSeries as any} height={320} />
                    </div>
                </div>
            </div>

            <div className="col-xl-4 col-12">
                <div className="card">
                    <div className="card-header"><h4 className="card-title m-0">Delivery Exceptions (AI)</h4></div>
                    <div className="card-body">
                        <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={320} />
                    </div>
                </div>
            </div>
        </div>
    );
}

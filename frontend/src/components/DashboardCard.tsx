import React from "react";

type Props = {
    title: string;
    icon?: string;
    value: string | number;
    subtitle?: string;
    color?: string; // primary, success, warning etc.
};

export default function DashboardCard({ title, icon, value, subtitle, color = "primary" }: Props) {
    return (
        <div className="col-xl-3 col-md-6 col-12">
            <div className="card">
                <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bolder mb-0">{value}</h4>
                        <p className="card-text mb-0">{title}</p>
                        {subtitle && <small className="text-muted">{subtitle}</small>}
                    </div>
                    {icon && (
                        <div className={`avatar bg-label-${color} rounded-circle`}>
                            <i className={`ti tabler-${icon} icon-lg`} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

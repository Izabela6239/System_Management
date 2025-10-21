import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-content content">
            <div className="content-overlay" />
            <div className="header-navbar-shadow" />
            <div className="content-wrapper">
                <div className="content-header row mb-2">
                    <div className="col-12">
                        <h2 className="content-header-title float-left mb-0">Dashboard</h2>
                        <div className="breadcrumb-wrapper">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">Admin</li>
                                <li className="breadcrumb-item active">Overview</li>
                            </ol>
                        </div>
                    </div>
                </div>
                <div className="content-body">{children}</div>
            </div>
        </div>
    );
}

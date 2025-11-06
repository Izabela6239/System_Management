import { Navigate, useLocation } from "react-router-dom";
import React from "react";

type Role = "ADMIN" | "EMPLOYEE";

export default function RequireRole({
                                        role,
                                        children,
                                    }: {
    role: Role;
    children: JSX.Element;
}) {
    const token = localStorage.getItem("token");
    const storedRole = (localStorage.getItem("role") || "").toUpperCase();

    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    if (storedRole !== role) {
        // dacă cineva încearcă să intre pe /admin fără rol corect
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}

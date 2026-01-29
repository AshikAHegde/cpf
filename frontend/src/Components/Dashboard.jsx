import React from "react";
import PageTransition from "./PageTransition";

const Dashboard = () => {
    return (
        <PageTransition>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <div className="mt-4 p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Welcome to your dashboard.</p>
                </div>
            </div>
        </PageTransition>
    );
};

export default Dashboard;

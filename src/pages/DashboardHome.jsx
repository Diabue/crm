import React from 'react';
import { DollarSign, Briefcase, Users, Trophy } from 'lucide-react';
import StatCard from '../components/Dashboard/StatCard';
import RevenueChart from '../components/Dashboard/RevenueChart';
import RecentActivity from '../components/Dashboard/RecentActivity';
import TaskList from '../components/Dashboard/TaskList';
import CustomerTable from '../components/Dashboard/CustomerTable';

const DashboardHome = () => {
    // Mock data for sparklines
    const sparkData1 = Array.from({ length: 10 }, (_, i) => ({ value: Math.random() * 100 }));
    const sparkData2 = Array.from({ length: 10 }, (_, i) => ({ value: Math.random() * 100 + 20 }));

    return (
        <div className="space-y-8 pb-20">
            {/* Row 1: Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value="$128,430"
                    change="+12.5%"
                    trend="up"
                    icon={DollarSign}
                    data={sparkData1}
                />
                <StatCard
                    title="Active Deals"
                    value="42"
                    change="+5.2%"
                    trend="up"
                    icon={Briefcase}
                />
                <StatCard
                    title="New Leads"
                    value="315"
                    change="-2.4%"
                    trend="down"
                    icon={Users}
                />
                <StatCard
                    title="Win Rate"
                    value="64%"
                    change="+1.8%"
                    trend="up"
                    icon={Trophy}
                    data={sparkData2}
                />
            </div>

            {/* Row 2: Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
                <div className="lg:col-span-8 h-full">
                    <RevenueChart />
                </div>
                <div className="lg:col-span-4 h-full">
                    <RecentActivity />
                </div>
            </div>

            {/* Row 3: Tasks & Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                <div className="h-full">
                    <TaskList />
                </div>
                <div className="h-full">
                    <CustomerTable />
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;

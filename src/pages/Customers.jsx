import React, { useState } from 'react';
import { Mail, Search, Filter, MoreVertical, Send, CheckCircle2 } from 'lucide-react';

const Customers = () => {
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [activeTab, setActiveTab] = useState('All');

    // Mock Data
    const [customers] = useState([
        { id: 1, name: 'Acme Corp', contact: 'John Doe', email: 'john@acme.com', status: 'Customer', lastContact: '2 days ago' },
        { id: 2, name: 'TechFlow Inc', contact: 'Sarah Smith', email: 'sarah@techflow.com', status: 'Potential', lastContact: '5 hours ago' },
        { id: 3, name: 'Global Systems', contact: 'Mike Johnson', email: 'mike@global.com', status: 'Cold', lastContact: '1 week ago' },
        { id: 4, name: 'Stark Ind', contact: 'Tony Stark', email: 'tony@stark.com', status: 'Refused', lastContact: '3 days ago' },
        { id: 5, name: 'Wayne Ent', contact: 'Bruce Wayne', email: 'bruce@wayne.com', status: 'Customer', lastContact: '1 day ago' },
    ]);

    const statusColors = {
        Customer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        Potential: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        Cold: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        Refused: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    const filteredCustomers = activeTab === 'All'
        ? customers
        : customers.filter(c => c.status === activeTab);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Customers & Leads</h1>
                    <p className="text-text-secondary">Manage your relationships and email campaigns</p>
                </div>
                <button
                    onClick={() => setShowCampaignModal(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                    <Mail size={18} />
                    <span>New Campaign</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
                <div className="flex bg-surface border border-border rounded-xl p-1">
                    {['All', 'Customer', 'Potential', 'Cold'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-background text-white shadow-sm' : 'text-text-secondary hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customers Table */}
            <div className="glass-card flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm z-10">
                            <tr className="text-xs text-text-secondary border-b border-border">
                                <th className="py-4 pl-6 font-medium">Customer</th>
                                <th className="py-4 font-medium">Contact</th>
                                <th className="py-4 font-medium">Status</th>
                                <th className="py-4 font-medium">Last Contact</th>
                                <th className="py-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border/50">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="group hover:bg-surface-highlight/30 transition-colors">
                                    <td className="py-3 pl-6">
                                        <div className="font-medium text-white">{customer.name}</div>
                                        <div className="text-xs text-text-secondary">{customer.email}</div>
                                    </td>
                                    <td className="py-3 text-text-secondary">{customer.contact}</td>
                                    <td className="py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[customer.status]}`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-text-secondary">{customer.lastContact}</td>
                                    <td className="py-3 pr-6 text-right">
                                        <button className="text-text-secondary hover:text-white p-1 rounded-lg hover:bg-surface-highlight transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Mail className="text-primary" />
                                New Email Campaign
                            </h2>
                            <button onClick={() => setShowCampaignModal(false)} className="text-text-secondary hover:text-white">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-secondary">Recipients</label>
                                <div className="flex gap-2">
                                    <select className="bg-background border border-border rounded-xl px-4 py-2.5 text-white w-full focus:border-primary/50 outline-none">
                                        <option>All Leads (543)</option>
                                        <option>Cold Leads (320)</option>
                                        <option>Potential Customes (120)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-secondary">Subject Line</label>
                                <input type="text" placeholder="e.g., Exclusive Offer for You" className="bg-background border border-border rounded-xl px-4 py-2.5 text-white w-full focus:border-primary/50 outline-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-secondary">Message Body</label>
                                <textarea rows={6} placeholder="Write your email content here..." className="bg-background border border-border rounded-xl px-4 py-3 text-white w-full focus:border-primary/50 outline-none resize-none" />
                            </div>
                        </div>

                        <div className="p-6 bg-surface-highlight/30 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setShowCampaignModal(false)}
                                className="px-5 py-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-surface-highlight transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
                                <Send size={18} />
                                Send Campaign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;

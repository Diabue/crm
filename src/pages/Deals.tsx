import React, { useState } from 'react';
import { Plus, Kanban, XCircle, CheckCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { Deal } from '../types';

const Deals: React.FC = () => {
    const { deals, customers, addDeal, updateDealStatus } = useDashboard();
    const [showModal, setShowModal] = useState(false);
    const [newDealValue, setNewDealValue] = useState<string>('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');

    const handleAddDeal = () => {
        const val = parseFloat(newDealValue);
        if (isNaN(val) || !selectedCustomerId) {
            alert('Please enter a valid amount and select a customer');
            return;
        }

        const customer = customers.find(c => c.id === Number(selectedCustomerId));
        const customerName = customer ? customer.name : 'Unknown';
        const dealTitle = `$${val.toLocaleString()} Deal - ${customerName}`;

        const deal: Deal = {
            id: Date.now(),
            value: val,
            title: dealTitle,
            customerId: Number(selectedCustomerId),
            company: customer ? customer.company || customerName : 'Unknown',
            description: dealTitle,
            status: 'Active',
            date: new Date().toLocaleDateString()
        };

        addDeal(deal);
        setSelectedCustomerId('');
        setNewDealValue('');
        setShowModal(false);
    };

    const activeDeals = deals.filter(d => d.status === 'Active');

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Deals Pipeline</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    <span>Add Deal</span>
                </button>
            </div>

            {activeDeals.length === 0 ? (
                <div className="flex items-center justify-center flex-1 glass-card border-dashed">
                    <div className="text-center text-text-secondary">
                        <Kanban size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Active Deals</h3>
                        <p>Add a deal to see it here.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeDeals.map(deal => (
                        <div key={deal.id} className="glass-card p-5 flex flex-col justify-between hover:bg-surface-highlight/10 transition-colors">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-text-secondary">{deal.date}</span>
                                    <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30">Active</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">${deal.value.toLocaleString()}</h3>
                                <p className="text-sm text-text-secondary">{deal.description}</p>
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                                <button
                                    onClick={() => updateDealStatus(deal.id, 'Won')}
                                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-2 rounded-lg text-xs font-semibold border border-emerald-500/30 transition-all"
                                >
                                    <CheckCircle size={14} /> Won
                                </button>
                                <button
                                    onClick={() => updateDealStatus(deal.id, 'Lost')}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg text-xs font-semibold border border-red-500/30 transition-all"
                                >
                                    <XCircle size={14} /> Lost
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Deal Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Add New Deal</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-text-secondary mb-1 block">Value ($)</label>
                                <input
                                    type="number"
                                    value={newDealValue}
                                    onChange={(e) => setNewDealValue(e.target.value)}
                                    placeholder="10000"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-text-secondary mb-1 block">Customer</label>
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-surface-highlight transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddDeal}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all"
                            >
                                Add Deal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Deals;

import React, { useState } from 'react';
import { Mail, Search, Send, Trash2, Plus, X, Edit2 } from 'lucide-react';

import { useDashboard } from '../context/DashboardContext';
import { Customer } from '../types';

type CustomerStatus = Customer['status'];

const Customers: React.FC = () => {
    const { deleteCustomer, addCustomer, updateCustomerStatus, updateCustomer, customers } = useDashboard();
    const [showCampaignModal, setShowCampaignModal] = useState<boolean>(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'All' | CustomerStatus>('All');
    const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);

    // Form State
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        company: '',
        status: 'Lead' as CustomerStatus
    });

    const handleSaveCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomer.name || !newCustomer.email) {
            alert('Name and Email are required');
            return;
        }

        if (editingCustomerId) {
            await updateCustomer(editingCustomerId, {
                name: newCustomer.name,
                email: newCustomer.email,
                company: newCustomer.company,
                status: newCustomer.status
            });
        } else {
            await addCustomer(newCustomer);
        }

        resetModal();
    };

    const openEditModal = (customer: Customer) => {
        setNewCustomer({
            name: customer.name,
            email: customer.email,
            company: customer.company || '',
            status: customer.status
        });
        setEditingCustomerId(customer.id);
        setShowAddCustomerModal(true);
    };

    const resetModal = () => {
        setNewCustomer({ name: '', email: '', company: '', status: 'Lead' });
        setEditingCustomerId(null);
        setShowAddCustomerModal(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            await deleteCustomer(id);
        }
    };

    const statusColors: Record<string, string> = {
        Customer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        Potential: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        Cold: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        Refused: 'bg-red-500/10 text-red-500 border-red-500/20',
        Lead: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };

    const filteredCustomers = activeTab === 'All'
        ? customers
        : customers.filter(c => c.status === activeTab);

    return (
        <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">Customers & Leads</h1>
                    <p className="text-text-secondary text-sm">Manage your relationships and email campaigns</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddCustomerModal(true)}
                        className="flex items-center gap-2 bg-surface border border-border hover:bg-surface-highlight text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-medium transition-all active:scale-95 text-sm"
                    >
                        <Plus size={16} />
                        <span>Add</span>
                    </button>
                    <button
                        onClick={() => setShowCampaignModal(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95 text-sm"
                    >
                        <Mail size={16} />
                        <span>Campaign</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full bg-surface border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
                <div className="flex bg-surface border border-border rounded-xl p-1 overflow-x-auto gap-1 flex-shrink-0">
                    {(['All', 'Customer', 'Potential', 'Cold'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-background text-white shadow-sm' : 'text-text-secondary hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop: Table / Mobile: Cards */}
            <div className="glass-card flex-1 overflow-hidden flex flex-col">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm z-10">
                            <tr className="text-xs text-text-secondary border-b border-border">
                                <th className="py-4 pl-6 font-medium">Customer</th>
                                <th className="py-4 font-medium">Status</th>
                                <th className="py-4 font-medium">Value</th>
                                <th className="py-4 font-medium">Last Contact</th>
                                <th className="py-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border/50">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="group hover:bg-surface-highlight/30 transition-colors">
                                    <td className="py-3 pl-6">
                                        <div
                                            onClick={() => window.location.href = `/customers/${customer.id}`}
                                            className="font-medium text-white cursor-pointer hover:text-primary transition-colors"
                                        >
                                            {customer.name}
                                        </div>
                                        <div className="text-xs text-text-secondary">{customer.email}</div>
                                    </td>
                                    <td className="py-3">
                                        <select
                                            value={customer.status}
                                            onChange={(e) => updateCustomerStatus(customer.id, e.target.value as CustomerStatus)}
                                            className={`px-2 py-1 rounded-md text-xs font-medium border bg-transparent cursor-pointer outline-none focus:ring-1 focus:ring-white/20 transition-colors appearance-none text-center ${statusColors[customer.status]}`}
                                        >
                                            <option value="Lead" className="bg-surface text-gray-300">Lead</option>
                                            <option value="Potential" className="bg-surface text-blue-400">Potential</option>
                                            <option value="Customer" className="bg-surface text-emerald-400">Customer</option>
                                            <option value="Cold" className="bg-surface text-zinc-400">Cold</option>
                                            <option value="Refused" className="bg-surface text-red-400">Refused</option>
                                        </select>
                                    </td>
                                    <td className="py-3 text-text-secondary">{customer.value}</td>
                                    <td className="py-3 text-text-secondary">{customer.lastContact}</td>
                                    <td className="py-3 pr-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(customer)} className="text-text-secondary hover:text-primary p-1 rounded-lg hover:bg-surface-highlight transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(customer.id)} className="text-text-secondary hover:text-red-400 p-1 rounded-lg hover:bg-surface-highlight transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden overflow-y-auto flex-1 p-3 space-y-2">
                    {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-background rounded-xl p-4 border border-border/50">
                            <div className="flex items-start justify-between mb-2">
                                <div
                                    onClick={() => window.location.href = `/customers/${customer.id}`}
                                    className="font-semibold text-white cursor-pointer hover:text-primary transition-colors"
                                >
                                    {customer.name}
                                </div>
                                <select
                                    value={customer.status}
                                    onChange={(e) => updateCustomerStatus(customer.id, e.target.value as CustomerStatus)}
                                    className={`px-2 py-0.5 rounded-md text-xs font-medium border bg-transparent cursor-pointer outline-none appearance-none ${statusColors[customer.status]}`}
                                >
                                    <option value="Lead" className="bg-surface">Lead</option>
                                    <option value="Potential" className="bg-surface">Potential</option>
                                    <option value="Customer" className="bg-surface">Customer</option>
                                    <option value="Cold" className="bg-surface">Cold</option>
                                    <option value="Refused" className="bg-surface">Refused</option>
                                </select>
                            </div>
                            <div className="text-xs text-text-secondary mb-1">{customer.email}</div>
                            {customer.company && <div className="text-xs text-text-secondary">{customer.company}</div>}
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => openEditModal(customer)} className="text-text-secondary hover:text-primary p-1.5 rounded-lg bg-surface hover:bg-surface-highlight transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(customer.id)} className="text-text-secondary hover:text-red-400 p-1.5 rounded-lg bg-surface hover:bg-surface-highlight transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                    {filteredCustomers.length === 0 && (
                        <div className="text-center text-text-secondary py-12 text-sm">No customers found.</div>
                    )}
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
                                        <option>Potential Customers (120)</option>
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

            {/* Add/Edit Customer Modal */}
            {showAddCustomerModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="text-primary" />
                                {editingCustomerId ? 'Edit Customer' : 'Add Customer'}
                            </h2>
                            <button onClick={resetModal} className="text-text-secondary hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-1 block">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-1 block">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={newCustomer.email}
                                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-1 block">Company</label>
                                <input
                                    type="text"
                                    value={newCustomer.company}
                                    onChange={e => setNewCustomer({ ...newCustomer, company: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                    placeholder="Acme Inc"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-secondary mb-1 block">Status</label>
                                <select
                                    value={newCustomer.status}
                                    onChange={e => setNewCustomer({ ...newCustomer, status: e.target.value as CustomerStatus })}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                >
                                    <option value="Lead">Lead</option>
                                    <option value="Potential">Potential</option>
                                    <option value="Customer">Customer</option>
                                    <option value="Cold">Cold</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all mt-4"
                            >
                                {editingCustomerId ? 'Update Customer' : 'Add Customer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;

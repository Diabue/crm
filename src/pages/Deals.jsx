import React, { useState } from 'react';
import { Plus, Kanban, List } from 'lucide-react';

const Deals = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Deals Pipeline</h1>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95">
                    <Plus size={18} />
                    <span>Add Deal</span>
                </button>
            </div>

            <div className="flex items-center justify-center flex-1 glass-card border-dashed">
                <div className="text-center text-text-secondary">
                    <Kanban size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">Deals Module Under Construction</h3>
                    <p>This will be the Kanban/List view for managing deals.</p>
                </div>
            </div>
        </div>
    );
};

export default Deals;

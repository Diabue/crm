import React, { useState, useEffect, useRef } from 'react';
import { 
    Bot, Search, Terminal, RotateCw, Play,
    Users, TrendingUp, Zap, Mail, Phone, Calendar, Power, FileText,
    MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type AgentLog = {
    id: string;
    agent_name: string;
    message: string;
    created_at: string;
};

type Lead = {
    id: string;
    company_name: string;
    website_url: string;
    email: string;
    phone: string;
    status: string;
    created_at: string;
};

const AIProspecting: React.FC = () => {
    // Basic state
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('Wszystkie');
    const [isLoadingLeads, setIsLoadingLeads] = useState(true);

    // Manual Trigger States
    const [researchTriggerQuery, setResearchTriggerQuery] = useState('');
    const [waOnly, setWaOnly] = useState(false);

    // Agent Guideline state
    const [outreachGuideline, setOutreachGuideline] = useState('');
    const [closerGuideline, setCloserGuideline] = useState('');
    const [agentStatus, setAgentStatus] = useState({
        Research: true,
        Outreach: true,
        Closer: true
    });


    // Dynamic stats
    const stats = {
        total: leads.length,
        contacted: leads.filter(l => ['Wysłano Email', 'Gorący', 'Zamknięty'].includes(l.status)).length,
        closed: leads.filter(l => l.status === 'Zamknięty').length
    };

    const activeAgentsCount = Object.values(agentStatus).filter(Boolean).length;


    // Initial Fetch & Realtime Subscriptions
    useEffect(() => {
        const fetchInitialData = async () => {
            // Pobierz ostatnie 100 logów (najnowsze)
            const { data: logData } = await supabase
                .from('agent_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            if (logData) setLogs(logData.reverse());

            // Leads
            const { data: leadData } = await supabase
                .from('ai_leads')
                .select('*')
                .order('created_at', { ascending: false });
            if (leadData) setLeads(leadData);
            setIsLoadingLeads(false);

            // Settings
            const { data: settingsData } = await supabase.from('agent_settings').select('*');
            if (settingsData) {
                const outreach = settingsData.find(d => d.agent_name === 'Outreach');
                const closer = settingsData.find(d => d.agent_name === 'Closer');
                const research = settingsData.find(d => d.agent_name === 'Research');

                if (outreach) setOutreachGuideline(outreach.guidelines || '');
                if (closer) setCloserGuideline(closer.guidelines || '');
                setAgentStatus({
                    Research: research ? research.is_active !== false : true,
                    Outreach: outreach ? outreach.is_active !== false : true,
                    Closer: closer ? closer.is_active !== false : true,
                });
            }
        };
        fetchInitialData();

        // Subscription: Logs
        const logsSub = supabase
            .channel('agent-logs-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
                setLogs(current => [...current, payload.new as AgentLog]);
            })
            .subscribe();

        // Subscription: Leads
        const leadsSub = supabase
            .channel('ai-leads-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_leads' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setLeads(current => [payload.new as Lead, ...current]);
                } else if (payload.eventType === 'UPDATE') {
                    setLeads(current => current.map(l => l.id === payload.new.id ? payload.new as Lead : l));
                } else if (payload.eventType === 'DELETE') {
                    setLeads(current => current.filter(l => l.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(logsSub);
            supabase.removeChannel(leadsSub);
        };
    }, []);

    // Handlers
    const toggleAgentStatus = async (agentName: string) => {
        const current = agentStatus[agentName as keyof typeof agentStatus];
        const nextState = !current;
        setAgentStatus(prev => ({ ...prev, [agentName]: nextState }));
        await supabase.from('agent_settings').upsert({ agent_name: agentName, is_active: nextState, updated_at: new Date().toISOString() });
    };

    const saveGuideline = async (agentName: string, text: string) => {
        try {
            await supabase.from('agent_settings').upsert({ agent_name: agentName, guidelines: text, updated_at: new Date().toISOString() });
            alert(`Pomyślnie wgrano nowe myśli dla Agenta: ${agentName}!`);
        } catch(e) {
            alert("Błąd zapisu!");
        }
    };

    const handleTriggerResearch = async () => {
        if (!researchTriggerQuery.trim()) return alert("Wpisz czego szukamy!");
        try {
            const res = await fetch('https://crm-backend-production-7533.up.railway.app/api/agent/trigger-research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: researchTriggerQuery, waOnly })
            });
            if (res.ok) alert("Obudziłem Research Agenta! Rozpoczął polowanie.");
            else alert("Błąd wywoływania agenta.");
            setResearchTriggerQuery('');
        } catch (e) {
            alert("Błąd połączenia z backendem.");
        }
    };

    const handleTriggerOutreach = async () => {
        try {
            const res = await fetch('https://crm-backend-production-7533.up.railway.app/api/agent/trigger-outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) alert("Wydałem rozkaz Outreach Agentowi. Powinien właśnie wysyłać maile.");
            else alert("Błąd wywoływania agenta.");
        } catch (e) {
            alert("Błąd połączenia z backendem.");
        }
    };

    // Filtered Leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'Wszystkie' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'Nowy': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'Nowy WA': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
            case 'Wysłano Email': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            case 'WhatsApp': return 'bg-green-500/10 text-green-400 border-green-500/30';
            case 'Gorący': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
            case 'Zamknięty': return 'bg-green-600/10 text-green-500 border-green-600/30';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col p-4 bg-[#0a0a0d] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
                        <Bot className="text-primary" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">AI Prospects</h1>
                        <p className="text-text-secondary text-sm">Autonomous AI presales system — Research → Outreach → Closer</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${activeAgentsCount > 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${activeAgentsCount > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest">{activeAgentsCount} Agents Running</span>
                </div>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface/40 p-6 rounded-2xl border border-border backdrop-blur-sm flex items-center gap-4">
                    <div className="bg-blue-500/20 p-4 rounded-xl">
                        <Users className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-white">{stats.total}</p>
                        <p className="text-text-secondary text-sm uppercase tracking-wider font-medium">Total Prospects</p>
                    </div>
                </div>
                <div className="bg-surface/40 p-6 rounded-2xl border border-border backdrop-blur-sm flex items-center gap-4">
                    <div className="bg-green-500/20 p-4 rounded-xl">
                        <TrendingUp className="text-green-400" size={24} />
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-white">{stats.contacted}</p>
                        <p className="text-text-secondary text-sm uppercase tracking-wider font-medium">Contacted Today</p>
                    </div>
                </div>
                <div className="bg-surface/40 p-6 rounded-2xl border border-border backdrop-blur-sm flex items-center gap-4">
                    <div className="bg-purple-500/20 p-4 rounded-xl">
                        <Zap className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-white">{stats.closed}</p>
                        <p className="text-text-secondary text-sm uppercase tracking-wider font-medium">Deals Closed</p>
                    </div>
                </div>
            </div>

            {/* Main Area: Logs & Table - Fixed Height for 10 rows */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] mb-4">
                
                {/* Left: Terminal Logs (4 columns) */}
                <div className="lg:col-span-4 bg-[#0d1117] border border-border/50 rounded-2xl flex flex-col shadow-2xl overflow-hidden h-full">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Terminal className="text-green-400" size={18} />
                            <span className="text-sm text-gray-400 font-bold tracking-widest uppercase">Live Agent Logs</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Connected" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[13px] leading-relaxed select-text scrollbar-thin scrollbar-thumb-white/10">
                        {logs.length === 0 ? (
                            <div className="text-white/20 italic text-center mt-20">Initializing system logs...</div>
                        ) : (
                            logs.slice(-100).map(log => (
                                <div key={log.id} className="flex gap-3 hover:bg-white/5 pr-2 rounded transition-colors group">
                                    <span className="text-white/30 flex-shrink-0">[{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                                    <span className={`font-bold flex-shrink-0 ${
                                        log.agent_name === 'Research' ? 'text-blue-400' :
                                        log.agent_name === 'Outreach' ? 'text-purple-400' :
                                        log.agent_name === 'Closer' ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                        [{log.agent_name}]
                                    </span>
                                    <span className="text-gray-300 break-words flex-1">{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Table (8 columns) */}
                <div className="lg:col-span-8 bg-surface/50 border border-border rounded-2xl flex flex-col shadow-xl overflow-hidden h-full">
                    {/* Toolbar (Fixed) */}
                    <div className="p-4 border-b border-border flex flex-wrap items-center gap-4 bg-background/30 backdrop-blur-md flex-shrink-0">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                            <input 
                                type="text"
                                placeholder="Szukaj firmy lub maila..."
                                className="w-full bg-transparent border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-1 bg-background/50 p-1 rounded-xl border border-border">
                            {['Wszystkie', 'Nowy', 'Wysłano Email', 'Gorący', 'Zamknięty'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterStatus(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === cat ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-black/20 text-text-secondary text-[10px] uppercase font-bold tracking-widest border-b border-border sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4">Firma</th>
                                    <th className="px-6 py-4">Kontakt</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {isLoadingLeads ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-text-secondary italic">Loading leads database...</td>
                                    </tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-text-secondary italic">Brak wyników spełniających kryteria.</td>
                                    </tr>
                                ) : (
                                    filteredLeads.map(lead => (
                                        <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors border-b border-border/10">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 flex-shrink-0">
                                                        <span className="text-primary font-bold">{lead.company_name[0]}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-white font-semibold text-sm truncate max-w-[200px]">{lead.company_name}</div>
                                                        <div className="text-[11px] text-text-secondary truncate max-w-[150px]">{lead.website_url || 'Brak strony'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="space-y-0.5">
                                                    {lead.email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-blue-400/80">
                                                            <Mail size={12} className="flex-shrink-0" /> <span className="truncate max-w-[140px]">{lead.email}</span>
                                                        </div>
                                                    )}
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                            <Phone size={12} className="flex-shrink-0" /> {lead.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyles(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5 text-xs text-text-secondary font-mono">
                                                    <Calendar size={12} className="flex-shrink-0" /> {new Date(lead.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Command & Control */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
                
                {/* Bot Toggles (4 columns) */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-surface/50 p-6 rounded-2xl border border-border shadow-xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Power className="text-primary" size={20} />
                            <h2 className="text-lg font-bold text-white">Master Switches</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { id: 'Research', desc: 'Google Places (co 6h)' },
                                { id: 'Outreach', desc: 'Zimne Maile (co 1h)' },
                                { id: 'Closer', desc: 'Webhook WA/Email (24/7)' }
                            ].map(agent => (
                                <div key={agent.id} className={`p-4 rounded-xl border transition-all ${agentStatus[agent.id as keyof typeof agentStatus] ? 'bg-background/40 border-border' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`font-bold text-sm ${agentStatus[agent.id as keyof typeof agentStatus] ? 'text-white' : 'text-red-400'}`}>
                                                {agent.id} Agent
                                            </p>
                                            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">{agent.desc}</p>
                                        </div>
                                        <button 
                                            onClick={() => toggleAgentStatus(agent.id)}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                                                agentStatus[agent.id as keyof typeof agentStatus] 
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-red-500 hover:text-white' 
                                                    : 'bg-red-500 text-white hover:bg-green-500 hover:text-white'
                                            }`}
                                        >
                                            {agentStatus[agent.id as keyof typeof agentStatus] ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Manual Actions */}
                    <div className="bg-surface/50 p-6 rounded-2xl border border-border shadow-xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="text-orange-400" size={20} />
                            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                        </div>
                        
                        {/* Research Trigger */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Wymuś poszukiwania (Research)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="np. Restauracje Warszawa"
                                    className="flex-1 bg-black/40 border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    value={researchTriggerQuery}
                                    onChange={(e) => setResearchTriggerQuery(e.target.value)}
                                />
                                <button 
                                    onClick={handleTriggerResearch}
                                    className="bg-primary hover:bg-primary-hover p-2.5 rounded-xl text-white transition-all shadow-lg shadow-primary/20"
                                    title="Szukaj teraz"
                                >
                                    <RotateCw size={16} />
                                </button>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={waOnly}
                                    onChange={(e) => setWaOnly(e.target.checked)}
                                />
                                <div className={`w-3 h-3 rounded border transition-all ${waOnly ? 'bg-green-500 border-green-500' : 'border-border group-hover:border-primary'}`} />
                                <span className="text-[10px] text-text-secondary group-hover:text-white transition-colors">Tylko firmy z WhatsApp (bez WWW)</span>
                            </label>
                        </div>

                        {/* Outreach Trigger */}
                        <div className="pt-4 border-t border-border/50 space-y-3">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Wymuś kontakt (Outreach)</label>
                            <button 
                                onClick={handleTriggerOutreach}
                                className="w-full bg-surface-hover hover:bg-white hover:text-black py-2.5 rounded-xl border border-border text-[11px] font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Play size={14} /> Wyślij maile do "Nowych"
                            </button>
                        </div>
                    </div>
                </div>

                {/* Custom Guidelines (8 columns) */}
                <div className="md:col-span-8 bg-surface/50 p-6 rounded-2xl border border-border shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <FileText className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-white">Sekretny Notatnik Szefa</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Mail size={14} className="text-purple-400" /> Outreach Rules
                            </label>
                            <textarea 
                                className="w-full bg-[#0d0d12] border border-border rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-primary min-h-[160px] resize-none leading-relaxed"
                                placeholder="Wpisz instrukcje dla Agenta wysyłającego pierwsze maile..."
                                value={outreachGuideline}
                                onChange={(e) => setOutreachGuideline(e.target.value)}
                            />
                            <button 
                                onClick={() => saveGuideline('Outreach', outreachGuideline)}
                                className="w-full bg-surface-hover hover:bg-white hover:text-black py-2.5 rounded-xl border border-border text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Zap size={14} /> Update Outreach AI
                            </button>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} className="text-red-400" /> Closer Rules
                            </label>
                            <textarea 
                                className="w-full bg-[#0d0d12] border border-border rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-primary min-h-[160px] resize-none leading-relaxed"
                                placeholder="Wpisz instrukcje dla Agenta prowadzącego rozmowy..."
                                value={closerGuideline}
                                onChange={(e) => setCloserGuideline(e.target.value)}
                            />
                            <button 
                                onClick={() => saveGuideline('Closer', closerGuideline)}
                                className="w-full bg-surface-hover hover:bg-white hover:text-black py-2.5 rounded-xl border border-border text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Zap size={14} /> Update Closer AI
                            </button>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default AIProspecting;

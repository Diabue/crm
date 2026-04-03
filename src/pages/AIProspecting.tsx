import React, { useState, useEffect, useRef } from 'react';
import { Bot, Search, Play, Activity, Terminal, CheckCircle2, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AgentLog = {
    id: string;
    agent_name: string;
    message: string;
    created_at: string;
};

const AIProspecting: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Research' | 'Outreach' | 'Closer'>('Dashboard');
    const [logs, setLogs] = useState<AgentLog[]>([]);
    
    // Filtrowane logi dla wybranego taba
    const filteredLogs = activeTab === 'Dashboard' 
        ? logs 
        : logs.filter(log => log.agent_name === activeTab);

    const logsEndRef = useRef<HTMLDivElement>(null);

    // Automatyczne scrollowanie konsoli w dół
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredLogs]);

    // Pobieranie i strumieniowanie logów
    useEffect(() => {
        // 1. Inicjalne pobranie ostatnich logów
        const fetchLogs = async () => {
            const { data } = await supabase
                .from('agent_logs')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(100);
            
            if (data) setLogs(data);
        };
        fetchLogs();

        // 2. Subskrypcja Realtime na żywo (nasłuchuje insert'ów bez odświeżania strony)
        const subscription = supabase
            .channel('agent-logs-live')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'agent_logs' },
                (payload) => {
                    setLogs(current => [...current, payload.new as AgentLog]);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Połączono! Logi będą się aktualizować w czasie rzeczywistym.');
                }
            });

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    // Agent Guidelines (Sekretny Notatnik Szefa)
    const [outreachGuideline, setOutreachGuideline] = useState('');
    const [closerGuideline, setCloserGuideline] = useState('');
    
    // Status włączników odcinających zasilanie
    const [agentStatus, setAgentStatus] = useState({
        Research: true,
        Outreach: true,
        Closer: true
    });

    useEffect(() => {
        const fetchGuidelines = async () => {
             const { data } = await supabase.from('agent_settings').select('*');
             if (data) {
                 const outreach = data.find(d => d.agent_name === 'Outreach');
                 const closer = data.find(d => d.agent_name === 'Closer');
                 const research = data.find(d => d.agent_name === 'Research');

                 if (outreach) setOutreachGuideline(outreach.guidelines || '');
                 if (closer) setCloserGuideline(closer.guidelines || '');

                 setAgentStatus({
                     Research: research ? research.is_active !== false : true,
                     Outreach: outreach ? outreach.is_active !== false : true,
                     Closer: closer ? closer.is_active !== false : true,
                 });
             }
        };
        fetchGuidelines();
    }, []);

    const toggleAgentStatus = async (agentName: string) => {
        const current = agentStatus[agentName as keyof typeof agentStatus];
        const nextState = !current;
        setAgentStatus(prev => ({ ...prev, [agentName]: nextState }));
        
        try {
            await supabase.from('agent_settings').upsert({ agent_name: agentName, is_active: nextState, updated_at: new Date().toISOString() });
        } catch(e) {
            console.error(e);
        }
    };

    const saveGuideline = async (agentName: string, text: string) => {
        try {
            await supabase.from('agent_settings').upsert({ agent_name: agentName, guidelines: text, updated_at: new Date().toISOString() });
            alert(`Pomyślnie wgrano nowe myśli asystentowi: ${agentName}!`);
        } catch(e) {
            console.error(e);
            alert("Błąd zapisu!");
        }
    };

    // Research Trigger
    const [searchQuery, setSearchQuery] = useState('');
    const handleTriggerResearch = async () => {
        try {
            const res = await fetch('https://crm-backend-production-7533.up.railway.app/api/agent/trigger-research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery })
            });
            if (res.ok) alert(`Obudziłem Research Agenta! Szuka właśnie: "${searchQuery || 'Firma'}". Zerknij w prawo do logów.`);
            else alert("Nie udało się wypuścić agenta. Czy backend żyje?");
            setSearchQuery('');
        } catch (e) {
            console.error(e);
            alert("Błąd połączenia z backendem przy wywoływaniu Agenta.");
        }
    };

    // Outreach Trigger
    const handleTriggerOutreach = async () => {
        try {
            const res = await fetch('https://crm-backend-production-7533.up.railway.app/api/agent/trigger-outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) alert("Kazałem Outreach Agentowi rozejrzeć się po bazie i powysyłać zaległe maile! Zobacz logi.");
            else alert("Błąd wywoływania Outreach Agenta.");
        } catch (e) {
            console.error(e);
            alert("Błąd połączenia z backendem.");
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <header className="flex justify-between items-center bg-surface/50 p-6 rounded-2xl border border-border flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Bot className="text-primary" size={36} />
                        MKSITES Multi-Agent System
                    </h1>
                    <p className="text-text-secondary mt-2">Nadzoruj pracę swoich wirtualnych pracowników SDR i przeglądaj ich logi operacyjne.</p>
                </div>
            </header>

            {/* Menu nawigacyjne zakładek */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
                {['Dashboard', 'Research', 'Outreach', 'Closer'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === tab 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-surface text-text-secondary border border-border hover:bg-surface-hover hover:text-white'
                        }`}
                    >
                        {tab === 'Dashboard' && <Activity size={18} />}
                        {tab === 'Research' && <Search size={18} />}
                        {tab === 'Outreach' && <Play size={18} />}
                        {tab === 'Closer' && <CheckCircle2 size={18} />}
                        {tab} Agent
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                 {/* Lewy panel akcji - zależny od taba */}
                 <div className="lg:col-span-1 bg-surface border border-border rounded-2xl p-6 flex flex-col overflow-y-auto">
                    
                    {activeTab === 'Dashboard' && (
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-6">Mini Dashboard (Master Switch)</h2>
                            <p className="text-sm text-text-secondary mb-6">Wciśnij kolorowy przełącznik po prawej stronie, by wysłać Agenta na przymusowy urlop ze skutkiem natychmiastowym.</p>
                            
                            <div className="space-y-4">
                                <div className={`p-4 border rounded-xl transition-all ${agentStatus.Research ? 'bg-background border-border' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-medium ${agentStatus.Research ? 'text-text-secondary' : 'text-red-400 font-bold'}`}>Research Agent</span>
                                        <button onClick={() => toggleAgentStatus('Research')} className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${agentStatus.Research ? 'bg-green-500/20 text-green-400 hover:bg-red-500 hover:text-white' : 'bg-red-500 text-white hover:bg-green-500 hover:text-white'}`}>
                                            {agentStatus.Research ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className="text-xs text-text-secondary">CRON: {agentStatus.Research ? 'Aktywny (co 12h)' : 'UŚPIONY PRZEZ SZEFA'}</div>
                                </div>
                                <div className={`p-4 border rounded-xl transition-all ${agentStatus.Outreach ? 'bg-background border-border' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-medium ${agentStatus.Outreach ? 'text-text-secondary' : 'text-red-400 font-bold'}`}>Outreach Agent</span>
                                        <button onClick={() => toggleAgentStatus('Outreach')} className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${agentStatus.Outreach ? 'bg-green-500/20 text-green-400 hover:bg-red-500 hover:text-white' : 'bg-red-500 text-white hover:bg-green-500 hover:text-white'}`}>
                                            {agentStatus.Outreach ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className="text-xs text-text-secondary">CRON: {agentStatus.Outreach ? 'Aktywny (co 1h)' : 'UŚPIONY PRZEZ SZEFA'}</div>
                                </div>
                                <div className={`p-4 border rounded-xl transition-all ${agentStatus.Closer ? 'bg-background border-border' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-medium ${agentStatus.Closer ? 'text-text-secondary' : 'text-red-400 font-bold'}`}>Closer Agent</span>
                                        <button onClick={() => toggleAgentStatus('Closer')} className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${agentStatus.Closer ? 'bg-green-500/20 text-green-400 hover:bg-red-500 hover:text-white' : 'bg-red-500 text-white hover:bg-green-500 hover:text-white'}`}>
                                            {agentStatus.Closer ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className="text-xs text-text-secondary">Webhook: {agentStatus.Closer ? 'Nasłuchuje (24/7)' : 'UŚPIONY PRZEZ SZEFA'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Research' && (
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                Kontrola Agenta Poszukującego
                            </h2>
                            <p className="text-sm text-text-secondary mb-6">Agent automatycznie działa co 12 godzin. Możesz tutaj wymusić jednorazowe, niespodziewane szukanie w Google Places.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1">Czego szukamy?</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-background border border-border rounded-xl p-3 text-white focus:outline-none focus:border-primary"
                                        placeholder="np. Pranie tapicerek Łódź"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleTriggerResearch}
                                    className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCw size={18} /> Wymuś polowanie
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Outreach' && (
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                Kontrola Agenta Inicjatora
                            </h2>
                            <p className="text-sm text-text-secondary mb-6">Wysyła z zaskoczenia maile do firm ze statusem "Nowy". Domyślnie działa co 1 godzinę.</p>
                            
                            <button 
                                onClick={handleTriggerOutreach}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-6"
                            >
                                <Play size={18} /> Wypuść Agenta teraz
                            </button>

                            <div className="mt-4 border-t border-border pt-6">
                                <h3 className="text-lg font-medium text-white mb-2">Sekretny Notatnik Szefa</h3>
                                <p className="text-xs text-text-secondary mb-3">Wpisz nowe zasady budowania e-maili. Agent weźmie je do serca.</p>
                                <textarea 
                                    className="w-full bg-background border border-border rounded-xl p-3 text-white focus:outline-none focus:border-primary min-h-[120px] mb-3 text-sm"
                                    placeholder="Np. Dzisiaj próbujemy skusić ich audytem SEO za darmo, bądź bardzo luźny..."
                                    value={outreachGuideline}
                                    onChange={(e) => setOutreachGuideline(e.target.value)}
                                />
                                <button 
                                    onClick={() => saveGuideline('Outreach', outreachGuideline)}
                                    className="w-full bg-surface-hover border border-border text-white text-sm font-medium py-2 rounded-xl transition-all hover:bg-white hover:text-black"
                                >
                                    Zapisz Polecenie
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Closer' && (
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                Closer Agent (Informacje)
                            </h2>
                            <p className="text-sm text-text-secondary mb-4">Ten agent nie posiada ręcznego przycisku "Start". Będzie z automatu odpalał się za każdym razem, gdy na Twoją dedykowaną skrzynkę lub bramkę SMS wpadnie wiadomość zwrotna do Resend/Twilio Webhook.</p>
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-6">
                                <p className="text-sm text-primary/80">
                                    <strong>Status:</strong> Nasłuchiwanie na kanale Webhook.
                                </p>
                            </div>

                            <div className="mt-4 border-t border-border pt-6">
                                <h3 className="text-lg font-medium text-white mb-2">Sekretny Notatnik Szefa</h3>
                                <p className="text-xs text-text-secondary mb-3">Zmień sposób prowadzenia negocjacji w komunikatorach (np. prośby klienta o obniżkę).</p>
                                <textarea 
                                    className="w-full bg-background border border-border rounded-xl p-3 text-white focus:outline-none focus:border-primary min-h-[120px] mb-3 text-sm"
                                    placeholder="Np. Zaczynaj wyceny od 4000 zł w górę, nie zgadzaj się na rabaty dla małych firm..."
                                    value={closerGuideline}
                                    onChange={(e) => setCloserGuideline(e.target.value)}
                                />
                                <button 
                                    onClick={() => saveGuideline('Closer', closerGuideline)}
                                    className="w-full bg-surface-hover border border-border text-white text-sm font-medium py-2 rounded-xl transition-all hover:bg-white hover:text-black"
                                >
                                    Zapisz Polecenie
                                </button>
                            </div>
                        </div>
                    )}

                 </div>

                 {/* Prawy panel - Terminal */}
                 <div className="lg:col-span-2 bg-[#0d1117] border border-border/50 rounded-2xl p-4 flex flex-col min-h-0 font-mono shadow-inner relative">
                    {/* Header terminala */}
                    <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3 flex-shrink-0">
                        <Terminal className="text-green-400" size={18} />
                        <span className="text-sm text-gray-400 font-semibold tracking-wider uppercase">System Logs [{activeTab}]</span>
                        <div className="flex gap-1 ml-auto">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                    </div>

                    {/* Konsola Przewijana */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-sm select-text">
                        {filteredLogs.length === 0 ? (
                            <div className="text-gray-500 italic flex items-center justify-center h-full">Oczekiwanie na pierwsze logi w systemie...</div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} className="flex hover:bg-white/5 p-1 rounded transition-colors break-words">
                                    <span className="text-gray-500 w-[140px] flex-shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                    <span className={`w-[90px] font-bold flex-shrink-0 ${
                                        log.agent_name === 'Research' ? 'text-blue-400' :
                                        log.agent_name === 'Outreach' ? 'text-purple-400' :
                                        log.agent_name === 'Closer' ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                        {log.agent_name}
                                    </span>
                                    <span className="text-gray-300 ml-2">» {log.message}</span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default AIProspecting;

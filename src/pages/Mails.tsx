import React, { useState, useEffect } from 'react';
import { Mail, Send, Brain, Sparkles, CheckCircle2, XCircle, RefreshCw, Briefcase } from 'lucide-react';
import { Email, SentEmail, StatusBadgeProps } from '../types';
import { useDashboard } from '../context/DashboardContext';
import { supabase } from '../lib/supabase';

const Mails: React.FC = () => {
    const { addLead } = useDashboard();
    const [activeTab, setActiveTab] = useState<'Replied' | 'Sent'>('Replied');
    const [selectedMail, setSelectedMail] = useState<Email | null>(null);
    const [simulating, setSimulating] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [inbox, setInbox] = useState<Email[]>([]);
    const [sentMails, setSentMails] = useState<SentEmail[]>([]);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('emails')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching emails:', error);
        } else if (data) {
            const received: Email[] = [];
            const sent: SentEmail[] = [];

            data.forEach((e: any) => {
                const date = new Date(e.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                if (e.direction === 'Inbound' || e.direction === 'Received') {
                    received.push({
                        id: e.id,
                        from: e.sender || 'Unknown',
                        company: 'Unknown', // Join with customer if possible
                        subject: e.subject,
                        excerpt: e.body?.substring(0, 50) + '...' || '',
                        fullText: e.body || '',
                        date: date,
                        read: e.read || false,
                        aiSummary: e.ai_summary || '',
                        suggestedStatus: e.suggested_status as any,
                        customerId: e.customer_id
                    });
                } else {
                    sent.push({
                        id: e.id,
                        recipient: e.recipient || e.sender || 'Unknown',
                        subject: e.subject,
                        date: date,
                        status: e.status || 'Sent'
                    });
                }
            });

            setInbox(received);
            setSentMails(sent);
        }
        setLoading(false);
    };


    // Simulation Logic: Add real email to DB
    const simulateIncomingReply = async (): Promise<void> => {
        setSimulating(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const body = "Hello,\n\nI'm looking for a CRM solution. Can you send me your pricing list?\n\nRegards,\nJohn";
        const newMail = {
            sender: 'New Lead',
            recipient: 'me@company.com',
            subject: 'Inquiry about pricing',
            body: body,
            read: false,
            ai_summary: 'Pricing inquiry. High intent.',
            suggested_status: 'Potential',
            direction: 'Inbound',
            status: 'Received',
            user_id: (await supabase.auth.getUser()).data.user?.id
        };

        const { error } = await supabase.from('emails').insert([newMail]);

        if (!error) {
            addLead();
            await fetchEmails();
        } else {
            console.error(error);
            alert('Error simulating reply');
        }

        setSimulating(false);
    };

    const handleStatusUpdate = async (status: string) => {
        if (!selectedMail?.customerId) return;

        // Update customer status in DB
        const { error } = await supabase
            .from('customers')
            .update({ status })
            .eq('id', selectedMail.customerId);

        if (error) {
            console.error(error);
            alert('Error updating status');
        } else {
            alert(`Customer status updated to ${status}`);
        }
    };

    const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
        const colors: Record<string, string> = {
            'Potential': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Cold': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Customer': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mail Automation</h1>
                    <p className="text-text-secondary">Monitor campaigns - Realtime DB connected</p>
                </div>

                {/* Simulation Controls (Dev Mode) */}
                <button
                    onClick={simulateIncomingReply}
                    disabled={simulating}
                    className="flex items-center gap-2 bg-surface border border-border hover:border-primary/50 text-text-secondary hover:text-white px-4 py-2 rounded-xl transition-all font-mono text-sm"
                >
                    {simulating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} className="text-accent" />}
                    {simulating ? 'Saving to DB...' : 'Dev: Simulate Reply'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-border">
                {(['Replied', 'Sent'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-white'
                            }`}
                    >
                        {tab} ({tab === 'Replied' ? inbox.length : sentMails.length})
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-0 flex gap-6">

                {/* Left Panel: Mail List */}
                <div className="w-1/3 glass-card flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border/50 bg-surface/50">
                        <input
                            type="text"
                            placeholder="Search inbox..."
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading && activeTab === 'Replied' ? (
                            <div className="p-8 text-center text-text-secondary">Loading emails...</div>
                        ) : activeTab === 'Replied' ? (
                            inbox.length === 0 ? (
                                <div className="p-8 text-center text-text-secondary">No emails yet. Simulate one!</div>
                            ) : (
                                inbox.map(mail => (
                                    <div
                                        key={mail.id}
                                        onClick={() => setSelectedMail(mail)}
                                        className={`p-4 border-b border-border/30 cursor-pointer transition-colors hover:bg-surface-highlight/50 ${selectedMail?.id === mail.id ? 'bg-surface-highlight border-l-2 border-l-primary' : ''
                                            } ${!mail.read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className={`text-sm font-semibold ${!mail.read ? 'text-white' : 'text-text-secondary'}`}>{mail.from}</span>
                                            <span className="text-xs text-text-secondary">{mail.date}</span>
                                        </div>
                                        <div className="text-xs text-text-secondary mb-1 flex items-center gap-2">
                                            <Briefcase size={12} /> {mail.company}
                                        </div>
                                        <p className="text-sm text-text-secondary truncate">{mail.subject}</p>
                                        <p className="text-xs text-muted mt-1 truncate">{mail.excerpt}</p>
                                    </div>
                                ))
                            )
                        ) : (
                            sentMails.map(mail => (
                                <div key={mail.id} className="p-4 border-b border-border/30">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-semibold text-white">{mail.recipient}</span>
                                        <span className="text-xs text-text-secondary">{mail.date}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{mail.subject}</p>
                                    <div className="mt-2">
                                        <span className="bg-surface border border-border text-text-secondary text-[10px] px-2 py-0.5 rounded-full">
                                            {mail.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Reading Pane & AI Summary */}
                <div className="flex-1 glass-card flex flex-col p-6 relative overflow-hidden">
                    {selectedMail ? (
                        <>
                            {/* Message Heading */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">{selectedMail.subject}</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {selectedMail.from.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{selectedMail.from} <span className="text-text-secondary font-normal">&lt;{selectedMail.from.toLowerCase().replace(' ', '.')}@example.com&gt;</span></p>
                                            <p className="text-xs text-text-secondary">{selectedMail.company}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-text-secondary">{selectedMail.date}</p>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 overflow-y-auto mb-6 pr-2">
                                <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                                    {selectedMail.fullText}
                                </div>
                            </div>

                            {/* AI Intelligence Box */}
                            <div className="bg-surface-highlight/40 border border-primary/20 rounded-xl p-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent"></div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Brain size={20} />
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                            AI Summary & Suggestion
                                            <StatusBadge status={selectedMail.suggestedStatus} />
                                        </h4>
                                        <p className="text-sm text-text-secondary mb-3">{selectedMail.aiSummary}</p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleStatusUpdate(selectedMail.suggestedStatus)}
                                                className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <CheckCircle2 size={14} />
                                                Accept "{selectedMail.suggestedStatus}"
                                            </button>
                                            <button className="flex items-center gap-2 hover:bg-surface border border-transparent hover:border-border text-text-secondary px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                                <XCircle size={14} />
                                                Ignore
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reply Box */}
                            <div className="mt-4 pt-4 border-t border-border/50 flex gap-3">
                                <textarea
                                    placeholder="Type your reply..."
                                    rows={1}
                                    className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none resize-none"
                                />
                                <button className="bg-primary hover:bg-primary/90 text-white p-3 rounded-xl transition-colors">
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
                            <Mail size={48} className="opacity-20 mb-4" />
                            <p>Select an email to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Mails;

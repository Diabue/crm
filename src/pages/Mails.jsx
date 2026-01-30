import React, { useState } from 'react';
import { Mail, Send, Reply, Brain, Sparkles, CheckCircle2, XCircle, ChevronRight, RefreshCw, User, Briefcase } from 'lucide-react';

const Mails = () => {
    const [activeTab, setActiveTab] = useState('Replied'); // 'Sent' or 'Replied'
    const [selectedMail, setSelectedMail] = useState(null);
    const [simulating, setSimulating] = useState(false);

    // Mock Sent Mails
    const [sentMails] = useState([
        { id: 101, subject: 'Partnership Opportunity', recipient: 'ceo@techflow.com', date: '2 days ago', status: 'Sent' },
        { id: 102, subject: 'Q3 Product Update', recipient: 'marketing@global.com', date: '1 week ago', status: 'Opened' },
        { id: 103, subject: 'Exclusive Invite', recipient: 'john@acme.com', date: '3 hours ago', status: 'Clicked' },
    ]);

    // Mock Replied Mails (Inbox)
    const [inbox, setInbox] = useState([
        {
            id: 1,
            from: 'Sarah Smith',
            company: 'TechFlow Inc',
            subject: 'Re: Partnership Opportunity',
            excerpt: 'Thanks for reaching out! We are definitely interested in...',
            fullText: "Hi Alex,\n\nThanks for reaching out! We are definitely interested in hearing more about your solution. It seems to align perfectly with our Q4 goals.\n\nCould we jump on a quick call next Tuesday at 10 AM?\n\nBest,\nSarah",
            date: '10 mins ago',
            read: false,
            aiSummary: 'Positive interest. Wants to schedule a call next Tuesday.',
            suggestedStatus: 'Potential'
        }
    ]);

    // Simulation Logic
    const simulateIncomingReply = () => {
        setSimulating(true);
        setTimeout(() => {
            const newMail = {
                id: Date.now(),
                from: 'Mike Johnson',
                company: 'Global Systems',
                subject: 'Re: Q3 Product Update',
                excerpt: 'I am not interested right now, please remove me...',
                fullText: "Hello,\n\nPlease stop emailing me. We already have a vendor for this and are not looking to switch.\n\nThanks,\nMike",
                date: 'Just now',
                read: false,
                aiSummary: 'Negative sentiment. Explicitly asked to be removed.',
                suggestedStatus: 'Cold'
            };
            setInbox([newMail, ...inbox]);
            setSimulating(false);
            // Auto-select the new mail for demo purposes
            setSelectedMail(newMail);
        }, 1500);
    };

    const StatusBadge = ({ status }) => {
        const colors = {
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
                    <p className="text-text-secondary">Monitor campaigns and AI responses</p>
                </div>

                {/* Simulation Controls (Dev Mode) */}
                <button
                    onClick={simulateIncomingReply}
                    disabled={simulating}
                    className="flex items-center gap-2 bg-surface border border-border hover:border-primary/50 text-text-secondary hover:text-white px-4 py-2 rounded-xl transition-all font-mono text-sm"
                >
                    {simulating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} className="text-accent" />}
                    {simulating ? 'Simulating AI...' : 'Dev: Simulate Reply'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-border">
                {['Replied', 'Sent'].map(tab => (
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
                        {activeTab === 'Replied' ? (
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
                                            <button className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
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

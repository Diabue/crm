import React from 'react';

const activities = [
    {
        id: 1,
        user: 'Sarah Wilson',
        action: 'closed a deal with',
        target: 'TechFlow Inc.',
        time: '2 hours ago',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
        type: 'success'
    },
    {
        id: 2,
        user: 'Mike Chen',
        action: 'created a new task',
        target: 'Q3 Report Analysis',
        time: '4 hours ago',
        avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d',
        type: 'neutral'
    },
    {
        id: 3,
        user: 'Emily Davis',
        action: 'added a new lead',
        target: 'Green Energy Co.',
        time: '5 hours ago',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
        type: 'neutral'
    },
    {
        id: 4,
        user: 'Alex Morgan',
        action: 'updated the status of',
        target: 'Project Phoenix',
        time: '1 day ago',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
        type: 'warning'
    },
];

const RecentActivity = () => {
    return (
        <div className="glass-card p-6 h-full">
            <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>

            <div className="space-y-6 relative">
                {/* Vertical connector line */}
                <div className="absolute left-4 top-4 bottom-4 w-px bg-border/50"></div>

                {activities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-4">
                        <div className="relative z-10 w-8 h-8 rounded-full border-2 border-surface overflow-hidden flex-shrink-0">
                            <img src={activity.avatar} alt={activity.user} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex flex-wrap text-sm gap-1">
                                <span className="font-semibold text-white">{activity.user}</span>
                                <span className="text-text-secondary">{activity.action}</span>
                                <span className="font-medium text-white truncate">{activity.target}</span>
                            </div>
                            <p className="text-xs text-muted mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;

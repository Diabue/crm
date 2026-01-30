import React, { useState } from 'react';
import { CheckCircle2, Circle, Calendar } from 'lucide-react';

const initialTasks = [
    { id: 1, title: 'Review Q3 Marketing Strategy', due: 'Today', completed: false, tag: 'Marketing' },
    { id: 2, title: 'Client Meeting with Apex Corp', due: 'Tomorrow', completed: false, tag: 'Sales' },
    { id: 3, title: 'Update Revenue Projections', due: 'Oct 24', completed: true, tag: 'Finance' },
    { id: 4, title: 'Team Performance Review', due: 'Oct 25', completed: false, tag: 'HR' },
    { id: 5, title: 'Prepare Board Presentation', due: 'Oct 28', completed: false, tag: 'Admin' },
];

const TaskList = () => {
    const [tasks, setTasks] = useState(initialTasks);

    const toggleTask = (id) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    return (
        <div className="glass-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Upcoming Tasks</h3>
                <button className="text-primary text-sm font-medium hover:underline">View All</button>
            </div>

            <div className="space-y-3">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-all ${task.completed ? 'bg-surface-highlight/30' : 'bg-surface-highlight hover:bg-surface-highlight/80'
                            }`}
                    >
                        <button
                            onClick={() => toggleTask(task.id)}
                            className={`mt-0.5 transition-colors ${task.completed ? 'text-primary' : 'text-muted hover:text-white'}`}
                        >
                            {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>

                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate transition-all ${task.completed ? 'text-muted line-through' : 'text-white'
                                }`}>
                                {task.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex items-center gap-1 text-xs text-text-secondary">
                                    <Calendar size={12} />
                                    <span>{task.due}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted`}>
                                    {task.tag}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskList;

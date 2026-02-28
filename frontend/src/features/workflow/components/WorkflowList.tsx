import React, { useEffect, useState } from 'react';
import { workflowService, IWorkflow, WorkflowStatus } from '../../../services/workflow.service';
import { Plus, Edit2, Trash2, Rocket, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export const WorkflowList: React.FC = () => {
    const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const response = await workflowService.getAllWorkflows();
            setWorkflows(response.data);
        } catch (error) {
            toast.error('Failed to load workflows');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this workflow?')) return;
        try {
            await workflowService.deleteWorkflow(id);
            toast.success('Workflow deleted');
            fetchWorkflows();
        } catch (error) {
            toast.error('Failed to delete workflow');
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await workflowService.publishWorkflow(id);
            toast.success('Workflow published successfully');
            fetchWorkflows();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to publish workflow');
        }
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: WorkflowStatus) => {
        switch (status) {
            case WorkflowStatus.ACTIVE: return 'bg-green-500/20 text-green-400 border-green-500/50';
            case WorkflowStatus.DRAFT: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
            case WorkflowStatus.ARCHIVED: return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
                    <p className="text-slate-400">Manage and deploy your automated processes</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                    <Plus size={20} />
                    Create New
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search workflows..."
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                    <p className="text-slate-400">Loading your workflows...</p>
                </div>
            ) : filteredWorkflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <p className="text-slate-400 text-lg">No workflows found</p>
                    <button className="mt-4 text-blue-400 hover:text-blue-300 transition-colors">Create your first one</button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredWorkflows.map((workflow) => (
                        <div key={workflow.id} className="group bg-slate-900/50 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl transition-all hover:bg-slate-900/80">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                                        <Rocket size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-semibold text-white">{workflow.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(workflow.status)}`}>
                                                {workflow.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-1">{workflow.description || 'No description provided'}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                            <span>v{workflow.version}</span>
                                            <span>•</span>
                                            <span>{workflow._count?.steps || 0} Steps</span>
                                            <span>•</span>
                                            <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {workflow.status === WorkflowStatus.DRAFT && (
                                        <button
                                            onClick={() => handlePublish(workflow.id)}
                                            className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                                            title="Publish"
                                        >
                                            <Rocket size={20} />
                                        </button>
                                    )}
                                    <button className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(workflow.id)}
                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

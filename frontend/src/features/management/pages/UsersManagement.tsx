import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Mail, Shield, UserPlus, Filter, Search as SearchIcon, MoreVertical, Edit2, Trash2, Users, FileSpreadsheet } from 'lucide-react';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { ExcelImportModal } from '../components/ExcelImportModal';

export function UsersManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/users', {
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                setUsers(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getRoleBadge = (user: any) => {
        if (user.admin) return { label: 'Administrateur', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
        if (user.rh) return { label: 'Responsable RH', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
        if (user.manager) return { label: 'Manager', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        if (user.employee) return { label: 'Employé', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
        return { label: 'Inconnu', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    };

    const filteredUsers = users.filter(user =>
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 min-h-full">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-sm ${toast.type === 'success'
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : 'bg-red-500 text-white border-red-400'
                            }`}
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-h1-blue" />
                        Gestion des Utilisateurs
                    </h1>
                    <p className="text-zinc-500 mt-1">Gérez les membres de votre organisation et leurs permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsExcelModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        IMPORTER VIA EXCEL
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-h1-blue hover:bg-h1-blue/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-h1-blue/20"
                    >
                        <Plus className="w-5 h-5" />
                        NOUVEAU UTILISATEUR
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-500 hover:text-h1-blue hover:border-h1-blue transition-all">
                            <Filter className="w-4 h-4" />
                            FILTRER
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Utilisateur</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Rôle</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Email</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date de création</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-h1-blue/20 border-t-h1-blue rounded-full animate-spin"></div>
                                            <p className="text-zinc-500 font-bold animate-pulse">Chargement des utilisateurs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => {
                                    const role = getRoleBadge(user);
                                    return (
                                        <tr key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-h1-blue/10 flex items-center justify-center text-h1-blue overflow-hidden border border-h1-blue/20">
                                                        <span className="font-black text-sm">{user.firstName[0]}{user.lastName[0]}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white capitalize">{user.firstName} {user.lastName}</p>
                                                        <p className="text-xs text-zinc-500">ID: {user.id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${role.color}`}>
                                                    {role.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                    <Mail className="w-4 h-4 opacity-50" />
                                                    <span className="text-sm">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-zinc-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 relative">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(activeDropdown === user.id ? null : user.id);
                                                            setSelectedUser(user);
                                                        }}
                                                        className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-h1-blue transition-all"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>

                                                    <AnimatePresence>
                                                        {activeDropdown === user.id && (
                                                            <motion.div
                                                                ref={dropdownRef}
                                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                                            >
                                                                <div className="p-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setIsEditModalOpen(true);
                                                                            setActiveDropdown(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-h1-blue/10 hover:text-h1-blue rounded-xl transition-all"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                        Modifier l'utilisateur
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setIsDeleteModalOpen(true);
                                                                            setActiveDropdown(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Supprimer l'utilisateur
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                <UserPlus className="w-8 h-8" />
                                            </div>
                                            <p className="text-zinc-500 font-medium">Aucun utilisateur trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchUsers();
                    showToast('Utilisateur créé avec succès !');
                }}
            />

            <ExcelImportModal
                isOpen={isExcelModalOpen}
                onClose={() => setIsExcelModalOpen(false)}
                onSuccess={() => {
                    fetchUsers();
                    showToast('Importation terminée avec succès !');
                }}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                    fetchUsers();
                    showToast('Utilisateur mis à jour avec succès !');
                }}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onSuccess={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedUser(null);
                    fetchUsers();
                    showToast('Utilisateur supprimé avec succès !');
                }}
            />
        </div>
    );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

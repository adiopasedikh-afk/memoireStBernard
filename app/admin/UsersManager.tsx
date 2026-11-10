'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/app/lib/api';

interface ManagedUser {
  id: number;
  email: string;
  role: 'admin' | 'member';
  is_active: boolean | number;
  created_at: string;
}

export default function UsersManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');
  const [isAdding, setIsAdding] = useState(false);

  const loadUsers = useCallback(async () => {
    const result = await apiRequest<{ data: ManagedUser[] }>('/api/admin/users');
    return result.data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialUsers() {
      try {
        const result = await loadUsers();
        if (!cancelled) setUsers(result);
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les comptes.');
        }
      }
    }

    loadInitialUsers();
    return () => {
      cancelled = true;
    };
  }, [loadUsers]);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      setEmail('');
      setPassword('');
      setRole('member');
      setSuccessMessage('Le compte a été créé.');
      setIsAdding(false);
      setSelectedUserId(null);
      setEditRole('member');
      setUsers(await loadUsers());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de créer le compte.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (user: ManagedUser, changes: { role?: 'admin' | 'member'; isActive?: boolean }) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiRequest(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      });
      setSelectedUserId(null);
      setEditRole('member');
      setSuccessMessage('Le compte a été mis à jour.');
      setUsers(await loadUsers());
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Impossible de modifier le compte.');
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
      <div>
        <h2 className="text-lg font-bold">Gestion des comptes</h2>
        <p className="mt-1 text-xs text-slate-400">Créez des comptes avec un mot de passe temporaire d’au moins 12 caractères.</p>
      </div>

      {isAdding && <form onSubmit={handleCreateUser} className="grid gap-3 rounded-xl border border-amber-500/30 p-4 md:grid-cols-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Adresse e-mail"
          aria-label="Adresse e-mail"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mot de passe temporaire"
          aria-label="Mot de passe temporaire"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as 'admin' | 'member')}
          aria-label="Rôle du compte"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="member">Membre</option>
          <option value="admin">Administrateur</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer le compte'}
        </button>
        <div className="flex justify-end md:col-span-4">
          <button type="button" onClick={() => setIsAdding(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">Annuler</button>
        </div>
      </form>}

      {(errorMessage || successMessage) && (
        <p role="status" className={`text-sm ${errorMessage ? 'text-rose-300' : 'text-emerald-300'}`}>
          {errorMessage || successMessage}
        </p>
      )}

      <ul className="divide-y divide-slate-800">
        {users.map((user) => {
          const isActive = user.is_active === true || user.is_active === 1;
          return (
            <li key={user.id} className="py-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(user.id);
                  setEditRole(user.role);
                  setIsAdding(false);
                }}
                aria-pressed={selectedUserId === user.id}
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                  selectedUserId === user.id ? 'bg-slate-800 ring-1 ring-amber-500' : 'hover:bg-slate-800/60'
                }`}
              >
                <span>
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-slate-400">{isActive ? 'Actif' : 'Désactivé'}</p>
                </span>
                <span className="text-xs text-slate-400">{user.role === 'admin' ? 'Administrateur' : 'Membre'}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {users.find((user) => user.id === selectedUserId) ? (() => {
        const selectedUser = users.find((user) => user.id === selectedUserId)!;
        const isActive = selectedUser.is_active === true || selectedUser.is_active === 1;
        return (
          <div className="space-y-4 rounded-xl border border-amber-500/30 bg-slate-950 p-4">
            <h3 className="font-semibold">{selectedUser.email}</h3>
            <label className="block text-xs font-semibold text-slate-300">
              Rôle
              <select value={editRole} onChange={(event) => setEditRole(event.target.value as 'admin' | 'member')} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white sm:max-w-xs">
                <option value="member">Membre</option>
                <option value="admin">Administrateur</option>
              </select>
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => { setSelectedUserId(null); setEditRole('member'); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">Fermer</button>
              <button type="button" onClick={() => updateUser(selectedUser, { isActive: !isActive })} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">{isActive ? 'Suspendre le compte' : 'Réactiver le compte'}</button>
              <button type="button" disabled={loading || selectedUser.role === editRole} onClick={() => updateUser(selectedUser, { role: editRole })} className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Enregistrer le rôle</button>
            </div>
          </div>
        );
      })() : !isAdding && (
        <div className="flex justify-end">
          <button type="button" onClick={() => { setSelectedUserId(null); setIsAdding(true); }} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">Ajouter un compte</button>
        </div>
      )}
    </section>
  );
}

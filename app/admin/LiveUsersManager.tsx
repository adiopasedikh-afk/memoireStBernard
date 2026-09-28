'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

interface LiveUsersManagerProps {
    adminEmail: string;
}

interface UserPresence {
    email: string;
    onlineAt: string;
}

export function LiveUsersManager({ adminEmail }: LiveUsersManagerProps) {
    const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
    const supabase = createClient();

    useEffect(() => {
        // Canal Supabase Realtime Presence
        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: adminEmail,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const usersList: UserPresence[] = [];

                for (const key in newState) {
                    const presenceArray = newState[key] as Array<{ email?: string; onlineAt?: string }>;
                    if (presenceArray && presenceArray.length > 0) {
                        usersList.push({
                            email: presenceArray[0].email || key,
                            onlineAt: presenceArray[0].onlineAt || new Date().toISOString(),
                        });
                    }
                }
                setOnlineUsers(usersList);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        email: adminEmail,
                        onlineAt: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [adminEmail, supabase]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>👥</span> Utilisateurs en ligne
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {onlineUsers.length} en direct
                </span>
            </div>

            {onlineUsers.length === 0 ? (
                <p className="text-xs text-slate-300 italic">Aucun utilisateur connecté pour le moment.</p>
            ) : (
                <ul className="divide-y divide-slate-800">
                    {onlineUsers.map((user, idx) => (
                        <li key={idx} className="py-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-100 font-medium">{user.email}</span>
                            <span className="text-slate-300 font-mono">
                                {new Date(user.onlineAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
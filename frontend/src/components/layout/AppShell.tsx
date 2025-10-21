import { ReactNode, useState } from 'react';
import { Menu, X, Search, Bell, Settings } from 'lucide-react';

export default function AppShell({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="min-h-screen bg-vx-bg text-vx-text">
            {/* Sidebar */}
            <aside className={`fixed z-30 h-screen bg-vx-card shadow-vx transition-all
        ${open ? 'w-64' : 'w-20'} px-4`}>
                <div className="flex items-center gap-3 h-16">
                    <button onClick={()=>setOpen(!open)} className="p-2 rounded-lg hover:bg-vx-bg">
                        {open ? <X size={20}/> : <Menu size={20}/> }
                    </button>
                    {open && <span className="font-semibold">Vuexy-ish</span>}
                </div>

                <nav className="mt-4 space-y-1">
                    {[
                        ['Dashboard','/'],
                        ['Fleet','/fleet'],
                        ['Invoice','/invoice'],
                        ['Users','/users'],
                        ['Roles & Permissions','/roles']
                    ].map(([label])=>(
                        <a key={label}
                           className="block rounded-xl px-3 py-2 text-sm hover:bg-vx-bg hover:text-vx-primary">
                            {label}
                        </a>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <div className={`transition-all ${open ? 'ml-64' : 'ml-20'}`}>
                {/* Topbar */}
                <header className="h-16 bg-vx-card shadow-vx flex items-center justify-between px-5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5" size={16}/>
                            <input placeholder="Search [CTRL + K]"
                                   className="pl-9 pr-3 py-2 rounded-xl bg-vx-bg outline-none text-sm w-72"/>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Bell size={18} className="text-vx-subt"/>
                        <Settings size={18} className="text-vx-subt"/>
                        <img src="https://i.pravatar.cc/32" alt="" className="w-8 h-8 rounded-full"/>
                    </div>
                </header>

                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}

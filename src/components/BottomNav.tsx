import { Link, useLocation } from '@tanstack/react-router';
import { Home, Droplets, HeartPulse, Trophy, User } from 'lucide-react';

const items = [
  { to: '/app/home', icon: Home, label: 'Início' },
  { to: '/app/hidratacao', icon: Droplets, label: 'Água' },
  { to: '/app/saude', icon: HeartPulse, label: 'Saúde' },
  { to: '/app/desafios', icon: Trophy, label: 'Desafios' },
  { to: '/app/perfil', icon: User, label: 'Perfil' },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? 'fill-primary/15' : ''}`} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

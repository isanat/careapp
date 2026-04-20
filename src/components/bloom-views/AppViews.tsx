import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Bell, Check, Star, MessageSquare, FileText, Shield, Euro, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/bloom-views/EvyraShared';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } };

// ── WALLET VIEW ───────────────────────────────────────────────
interface Transaction { id: number; type: 'credit' | 'debit'; desc: string; amount: number; date: string; status: 'COMPLETED' | 'PENDING'; }

const MOCK_TX: Transaction[] = [
  { id:1, type:'credit', desc:'Pagamento recebido — Contrato #1042', amount:320, date:'2026-04-14', status:'COMPLETED' },
  { id:2, type:'debit',  desc:'Comissão plataforma (10%)',           amount:32,  date:'2026-04-14', status:'COMPLETED' },
  { id:3, type:'credit', desc:'Pagamento recebido — Contrato #1038', amount:180, date:'2026-04-12', status:'COMPLETED' },
  { id:4, type:'credit', desc:'Bónus avaliação 5 estrelas',           amount:10,  date:'2026-04-11', status:'COMPLETED' },
  { id:5, type:'credit', desc:'Pagamento em Escrow — Contrato #1051', amount:240, date:'2026-04-10', status:'PENDING'   },
  { id:6, type:'debit',  desc:'Comissão plataforma (10%)',           amount:18,  date:'2026-04-10', status:'COMPLETED' },
  { id:7, type:'credit', desc:'Pagamento recebido — Contrato #1035', amount:400, date:'2026-04-08', status:'COMPLETED' },
];

export const WalletView = ({
  transactions,
}: {
  transactions?: Transaction[];
} = {}) => {
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const data = transactions || MOCK_TX;
  const filtered = filter === 'all' ? data : data.filter(t => t.type === filter);
  const available = data.filter(t => t.status === 'COMPLETED' && t.type === 'credit').reduce((s,t) => s+t.amount, 0)
                  - data.filter(t => t.status === 'COMPLETED' && t.type === 'debit').reduce((s,t) => s+t.amount, 0);
  const escrow    = data.filter(t => t.status === 'PENDING').reduce((s,t) => s+t.amount, 0);
  const total     = data.filter(t => t.type === 'credit').reduce((s,t) => s+t.amount, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <SectionHeader title="Minha Carteira" desc="Saldo de conta e histórico de transações" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 sm:p-10 text-primary-foreground shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative space-y-6">
          <div>
            <p className="text-[10px] font-display font-black uppercase tracking-widest opacity-70 mb-1">Saldo Disponível</p>
            <p className="text-4xl sm:text-5xl font-display font-black tracking-tighter">€{available.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['Total Ganhos', `€${total}`], ['Em Escrow', `€${escrow}`]].map(([label, value]) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4">
                <p className="text-[9px] font-display font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
                <p className="text-lg font-display font-black tracking-tighter">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="flex-1 rounded-2xl bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => toast.info('Levantar fundos...')}>Levantar</Button>
            <Button variant="secondary" size="sm" className="flex-1 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20" onClick={() => toast.info('Gerar extrato...')}>Extrato PDF</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[{ label:'Este Mês', value:'€510', sub:'+12%', color:'text-success' }, { label:'Contratos Ativos', value:'3', sub:'1 escrow', color:'text-primary' }, { label:'Taxa Plataforma', value:'10%', sub:'por pagamento', color:'text-warning' }].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border shadow-card p-4 text-center">
            <p className="text-[9px] font-display font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-display font-black tracking-tighter mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-display font-black uppercase tracking-widest text-foreground border-l-4 border-primary pl-3">Histórico</h3>
          <div className="flex gap-1">
            {([['all','Todos'],['credit','Entradas'],['debit','Saídas']] as const).map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-widest transition-all ${filter===v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{l}</button>
            ))}
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
          {filtered.map((t, i) => (
            <motion.div key={t.id} variants={itemVariants} className={`flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-all ${i > 0 ? 'border-t border-border/50' : ''}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${t.type==='credit' ? (t.status==='PENDING' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success') : 'bg-destructive/10 text-destructive'}`}>
                {t.type === 'credit' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-black text-foreground truncate">{t.desc}</p>
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {new Date(t.date).toLocaleDateString('pt-PT', { day:'2-digit', month:'short' })}
                  {t.status === 'PENDING' && <span className="ml-2 text-warning">• Pendente</span>}
                </p>
              </div>
              <p className={`font-display font-black text-base tracking-tighter shrink-0 ${t.type==='credit' ? (t.status==='PENDING'?'text-warning':'text-success') : 'text-destructive'}`}>
                {t.type === 'credit' ? '+' : '-'}€{t.amount}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="bg-info/5 border border-info/20 rounded-3xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center shrink-0 text-info"><Euro size={18} /></div>
        <div>
          <p className="text-sm font-display font-black text-foreground uppercase">Levantamentos IBAN</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Processados toda sexta-feira. Mínimo €50. Configure o seu IBAN nas definições.</p>
        </div>
      </div>
    </div>
  );
};

// ── NOTIFICATIONS VIEW ────────────────────────────────────────
interface Notification { id: number; type: string; title: string; msg: string; read: boolean; date: string; }

const ICON_MAP: Record<string, React.ElementType> = {
  contract_accepted: Check, payment_received: Euro, kyc_approved: Shield,
  review_received: Star, chat_message: MessageSquare, contract_created: FileText, contract_payment: AlertCircle,
};
const COLOR_MAP: Record<string, string> = {
  contract_accepted: 'bg-success/10 text-success', payment_received: 'bg-primary/10 text-primary',
  kyc_approved: 'bg-success/10 text-success', review_received: 'bg-warning/10 text-warning',
  chat_message: 'bg-info/10 text-info', contract_created: 'bg-primary/10 text-primary',
  contract_payment: 'bg-warning/10 text-warning',
};

const MOCK_NOTIFS: Notification[] = [
  { id:1, type:'contract_accepted', title:'Contrato Aceite',       msg:'Maria Silva aceitou o contrato #1042. Fundos em Escrow.', read:false, date:'2026-04-14T10:23:00' },
  { id:2, type:'payment_received',  title:'Pagamento Recebido',    msg:'Recebeu €320 referente ao Contrato #1038.', read:false, date:'2026-04-14T08:10:00' },
  { id:3, type:'kyc_approved',      title:'Identidade Verificada', msg:'A sua verificação KYC foi aprovada. Conta totalmente ativa.', read:false, date:'2026-04-13T16:45:00' },
  { id:4, type:'review_received',   title:'Nova Avaliação',        msg:'Família Costa deixou 5 estrelas: "Excelente profissional!"', read:true, date:'2026-04-12T14:30:00' },
  { id:5, type:'chat_message',      title:'Nova Mensagem',         msg:'João Ferreira enviou uma mensagem sobre o contrato.', read:true, date:'2026-04-12T11:00:00' },
  { id:6, type:'contract_created',  title:'Nova Proposta',         msg:'Família Moreira propôs um contrato. Clique para ver.', read:true, date:'2026-04-11T09:15:00' },
];

export const NotificacoesView = ({
  notifications,
  onMarkAsRead,
}: {
  notifications?: Notification[];
  onMarkAsRead?: (id?: number) => void;
} = {}) => {
  const [notifs, setNotifs] = useState(notifications || MOCK_NOTIFS);
  const unread = notifs.filter(n => !n.read).length;
  const markAll = () => {
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    onMarkAsRead?.();
  };
  const markOne = (id: number) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    onMarkAsRead?.(id);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Notificações" desc={unread > 0 ? `${unread} nova${unread !== 1 ? 's' : ''}` : 'Todas lidas'} />
        {unread > 0 && (
          <Button variant="outline" size="sm" className="rounded-2xl gap-2" onClick={markAll}>
            <Check size={14} /> Marcar todas
          </Button>
        )}
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
        {notifs.map(n => {
          const Icon = ICON_MAP[n.type] || Bell;
          const colorCls = COLOR_MAP[n.type] || 'bg-primary/10 text-primary';
          return (
            <motion.div key={n.id} variants={itemVariants} onClick={() => markOne(n.id)}
              className={`bg-card rounded-3xl border shadow-card cursor-pointer group transition-all hover:shadow-elevated flex items-start gap-4 p-5 sm:p-6 ${!n.read ? 'border-primary/30 bg-primary/[0.02]' : 'border-border'}`}>
              <div className={`w-12 h-12 rounded-2xl ${colorCls} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}><Icon size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className={`font-display font-black text-sm uppercase tracking-tight ${!n.read ? 'text-foreground' : 'text-foreground/75'}`}>{n.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.msg}</p>
                <span className="text-[10px] font-display font-bold text-muted-foreground/50 uppercase tracking-widest mt-1 block">
                  {new Date(n.date).toLocaleDateString('pt-PT', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
              {!n.read && <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1 animate-pulse" />}
            </motion.div>
          );
        })}
        {notifs.every(n => n.read) && (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto"><Bell size={28} className="text-muted-foreground" /></div>
            <p className="font-display font-black text-foreground uppercase">Nenhuma notificação</p>
            <p className="text-sm text-muted-foreground">Receberá notificações sobre contratos e propostas aqui</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ── CUIDADOR DETAIL ───────────────────────────────────────────
export const CuidadorDetailView = ({ onNavigate }: { onNavigate?: (v: string) => void }) => {
  const [tab, setTab] = useState('sobre');
  const c = {
    name: 'Helena Costa Ferreira', title: 'Enfermeira Especializada', city: 'Lisboa',
    rating: 4.9, reviews: 27, rate: 18, experience: '8 anos', verified: true, available: true,
    specialties: ['Cuidados Paliativos','Alzheimer/Demência','Fisioterapia','Administração de Medicação','Higiene Pessoal'],
    languages: ['Português','Inglês','Espanhol'],
    schedule: ['Segunda a Sexta','Manhã e Tarde','Full-time disponível'],
    bio: 'Enfermeira com 8 anos de experiência em cuidados domiciliários sénior. Especializada em cuidados paliativos e acompanhamento de pacientes com Alzheimer. Abordagem humanista, com foco no bem-estar físico e emocional.',
    ratingsList: [
      { author:'Família Moreira', rating:5, date:'2026-04-10', text:'Profissional excecional. Extremamente cuidadosa e empática.' },
      { author:'Família Santos',  rating:5, date:'2026-04-02', text:'Recomendo sem hesitar. Pontual e muito carinhosa.' },
      { author:'Família Pereira', rating:4, date:'2026-03-28', text:'Excelentes conhecimentos técnicos e boa comunicação.' },
    ],
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} size={13} className={i <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'} />)}
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-3xl">
      <button onClick={() => onNavigate?.('search-cuidadores')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-widest transition-colors">
        ← Voltar
      </button>

      {/* Header */}
      <div className="bg-card rounded-3xl border border-border shadow-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-display font-black text-primary">HCF</div>
            {c.verified && <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-success rounded-full flex items-center justify-center border-2 border-card"><Check size={12} className="text-success-foreground" /></div>}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-display font-black uppercase tracking-tighter text-foreground">{c.name}</h2>
                <p className="text-sm text-muted-foreground">{c.title} · {c.city}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${c.available ? 'bg-success/10 text-success border border-success/30' : 'bg-muted text-muted-foreground border border-border'}`}>{c.available ? 'Disponível' : 'Indisponível'}</span>
                {c.verified && <span className="text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">Verificado</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5"><StarRating rating={Math.round(c.rating)} /><span className="text-sm font-display font-black text-foreground">{c.rating}</span><span className="text-xs text-muted-foreground">({c.reviews})</span></div>
              <span className="text-xl font-display font-black text-primary">€{c.rate}<span className="text-sm text-muted-foreground font-normal">/h</span></span>
              <span className="text-xs text-muted-foreground">{c.experience} exp.</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {c.languages.map(l => <span key={l} className="text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground">{l}</span>)}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          <Button variant="outline" className="flex-1 rounded-2xl gap-2" onClick={() => onNavigate?.('chat')}><MessageSquare size={15}/> Mensagem</Button>
          <Button className="flex-1 rounded-2xl gap-2" onClick={() => onNavigate?.('nova-demanda')}><Shield size={15}/> Contratar</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[['sobre','Sobre'],['especialidades','Especialidades'],['avaliações','Avaliações']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 py-3 text-sm font-display font-bold transition-all border-b-2 ${tab===k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{l}</button>
        ))}
      </div>

      {tab === 'sobre' && (
        <div className="space-y-4">
          <div className="bg-card rounded-3xl border border-border shadow-card p-6">
            <p className="text-[10px] font-display font-black uppercase tracking-widest text-muted-foreground mb-3">Apresentação</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.bio}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{ label:'Taxa/Hora', value:`€${c.rate}`, color:'text-primary' }, { label:'Contratos', value:'12', color:'text-foreground' }, { label:'Avaliação', value:String(c.rating), color:'text-warning' }].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center shadow-card">
                <p className="text-[9px] font-display font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-display font-black tracking-tighter mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'especialidades' && (
        <div className="bg-card rounded-3xl border border-border shadow-card p-6 space-y-3">
          {c.specialties.map(s => (
            <div key={s} className="flex items-center gap-3 p-3 bg-secondary rounded-2xl border border-border/50">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center"><Check size={14} className="text-primary"/></div>
              <span className="text-sm font-display font-bold text-foreground">{s}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'avaliações' && (
        <div className="space-y-4">
          {c.ratingsList.map((r, i) => (
            <div key={i} className="bg-card rounded-3xl border border-border shadow-card p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-display font-black text-sm text-foreground uppercase">{r.author}</p>
                  <p className="text-[10px] text-muted-foreground font-display font-bold uppercase tracking-widest">{new Date(r.date).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'})}</p>
                </div>
                <StarRating rating={r.rating} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{r.text}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

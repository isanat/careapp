import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Mail, Lock, Heart, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

const LOGO = () => (
  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow">
    <Heart size={26} className="text-primary-foreground" fill="currentColor" />
  </div>
);

// ── LOGIN ────────────────────────────────────────────────────
export const LoginView = ({
  onNavigate,
  onSubmit,
}: {
  onNavigate?: (v: string) => void;
  onSubmit?: (email: string, password: string) => Promise<void>;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(email, password);
      } else {
        await new Promise(r => setTimeout(r, 1200));
        toast.success('Login efetuado!');
        onNavigate?.('dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <LOGO />
          <div>
            <h1 className="text-3xl font-display font-black uppercase tracking-tighter text-foreground">EVYRA</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">Plataforma de cuidados sénior</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl border border-border shadow-elevated p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-black uppercase tracking-tighter text-foreground">Entrar na Conta</h2>
            <p className="text-sm text-muted-foreground mt-1">Bem-vindo de volta</p>
          </div>

          {/* Google */}
          <Button variant="outline" className="w-full rounded-2xl" onClick={() => toast.info('Google login...')}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" required
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">Palavra-passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full pl-10 pr-12 py-3 bg-secondary border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" className="text-xs text-primary font-display font-bold hover:underline">Esqueci a palavra-passe</button>
            </div>
            <Button type="submit" size="lg" className="w-full rounded-2xl" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin mr-2" />A entrar...</> : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Sem conta?{' '}
            <button onClick={() => onNavigate?.('register')} className="text-primary font-display font-bold hover:underline">Registar</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ── REGISTER ─────────────────────────────────────────────────
type Role = 'FAMILY' | 'CAREGIVER';

export const RegisterView = ({
  onNavigate,
  onSubmitRegister,
}: {
  onNavigate?: (v: string) => void;
  onSubmitRegister?: (data: { name: string; email: string; phone: string; password: string; role: 'FAMILY' | 'CAREGIVER' }) => Promise<void>;
}) => {
  const [step, setStep]       = useState(1);
  const [role, setRole]       = useState<Role>('FAMILY');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) { toast.error('Aceite os termos para continuar'); return; }
    if (form.password !== form.confirm) { toast.error('As palavras-passe não coincidem'); return; }
    setLoading(true);
    try {
      if (onSubmitRegister) {
        await onSubmitRegister({ name: form.name, email: form.email, phone: form.phone, password: form.password, role });
      } else {
        await new Promise(r => setTimeout(r, 1200));
        toast.success('Conta criada!');
        onNavigate?.(role === 'FAMILY' ? 'family-setup' : 'profile-setup');
      }
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: Role; icon: React.ElementType; title: string; desc: string; tag: string; tagClass: string }[] = [
    { id: 'FAMILY', icon: Users, title: 'Família', desc: 'Procuro um cuidador para o meu familiar', tag: '€29 ativação', tagClass: 'bg-warning/10 text-warning border border-warning/30' },
    { id: 'CAREGIVER', icon: Heart, title: 'Cuidador(a)', desc: 'Sou profissional de saúde ou cuidador', tag: 'Gratuito', tagClass: 'bg-success/10 text-success border border-success/30' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-4">
          <LOGO />
          <h1 className="text-3xl font-display font-black uppercase tracking-tighter text-foreground">Criar Conta</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-display font-black transition-all ${s <= step ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground border border-border'}`}>
                {s < step ? <Check size={14} /> : s}
              </div>
              {s < 2 && <div className={`w-16 h-0.5 rounded-full transition-all ${s < step ? 'bg-primary' : 'bg-border'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-elevated p-8 space-y-6">
          {/* Step 1: Role */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-display font-black uppercase tracking-tighter">Qual é o seu papel?</h2>
                <p className="text-sm text-muted-foreground mt-1">Escolha o tipo de conta a criar</p>
              </div>
              <div className="space-y-3">
                {roles.map(r => (
                  <label key={r.id} onClick={() => setRole(r.id)}
                    className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${role === r.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${role === r.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      <r.icon size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-black text-foreground text-sm uppercase">{r.title}</span>
                        <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${r.tagClass}`}>{r.tag}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${role === r.id ? 'border-primary bg-primary' : 'border-border'}`}>
                      {role === r.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </label>
                ))}
              </div>
              <Button size="lg" className="w-full rounded-2xl" onClick={() => setStep(2)}>Continuar</Button>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-secondary rounded-2xl">
                {role === 'FAMILY' ? <Users size={18} className="text-muted-foreground" /> : <Heart size={18} className="text-muted-foreground" />}
                <span className="font-display font-bold text-sm text-foreground">{role === 'FAMILY' ? 'Família' : 'Cuidador(a)'}</span>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-[10px] font-display font-black text-primary uppercase tracking-widest hover:underline">Alterar</button>
              </div>
              {[
                { label: 'Nome Completo', key: 'name', type: 'text', placeholder: 'Nome completo' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'email@exemplo.com' },
                { label: 'Telemóvel', key: 'phone', type: 'tel', placeholder: '+351 912 345 678' },
                { label: 'Palavra-passe', key: 'password', type: showPass ? 'text' : 'password', placeholder: '••••••••' },
                { label: 'Confirmar Palavra-passe', key: 'confirm', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[10px] font-display font-black uppercase tracking-widest text-foreground">{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]} onChange={set(f.key)} placeholder={f.placeholder}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              ))}

              {role === 'FAMILY' && (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-2xl">
                  <p className="text-xs font-display font-black text-foreground uppercase">Taxa de Ativação — €29</p>
                  <p className="text-xs text-muted-foreground mt-1">Taxa única para acesso completo, verificação KYC e suporte dedicado.</p>
                </div>
              )}
              {role === 'CAREGIVER' && (
                <div className="p-4 bg-success/5 border border-success/20 rounded-2xl flex items-start gap-3">
                  <Check size={14} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-display font-black text-success uppercase">Registo Gratuito</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sem taxa de ativação. Crie o perfil e comece a receber propostas.</p>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <div onClick={() => setAcceptTerms(!acceptTerms)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all shrink-0 ${acceptTerms ? 'bg-primary border-primary' : 'border-border'}`}>
                  {acceptTerms && <Check size={11} className="text-primary-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">Aceito os <button type="button" className="text-primary font-medium hover:underline">Termos</button> e a <button type="button" className="text-primary font-medium hover:underline">Política de Privacidade</button></span>
              </label>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="rounded-2xl px-5" onClick={() => setStep(1)}>←</Button>
                <Button type="submit" size="lg" className="flex-1 rounded-2xl" disabled={loading || !acceptTerms}>
                  {loading ? <><Loader2 size={15} className="animate-spin mr-2"/>A criar...</> : 'Criar Conta'}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <button onClick={() => onNavigate?.('login')} className="text-primary font-display font-bold hover:underline">Entrar</button>
        </p>
      </div>
    </div>
  );
};

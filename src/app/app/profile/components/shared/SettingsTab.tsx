"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, getHeadingClasses, getBadgeClasses, tokens } from "@/lib/design-tokens";
import {
  IconBell,
  IconShield,
  IconTrash,
  IconLogout,
  IconLoader2,
} from "@/components/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

interface SettingsTabProps {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  pushLoading: boolean;
  pushError: string | null;
  isPushSupported: boolean;
  isPushEnabled: boolean;
  isDeleting: boolean;
  handleEnablePush: () => void;
  handleDeleteAccount: () => Promise<void>;
}

export function SettingsTab({
  deleteDialogOpen,
  setDeleteDialogOpen,
  pushLoading,
  pushError,
  isPushSupported,
  isPushEnabled,
  isDeleting,
  handleEnablePush,
  handleDeleteAccount,
}: SettingsTabProps) {
  const { t } = useI18n();

  return (
    <TabsContent value="settings" className={tokens.layout.sectionSpacing}>
      {/* Settings Section */}
      <section className="space-y-4">
        <h3 className={getHeadingClasses("sectionTitle")}>
          Preferências e Configurações
        </h3>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <IconBell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-foreground">
                Notificações Push
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Alertas em tempo real
              </p>
            </div>
          </div>
          {isPushSupported ? (
            isPushEnabled ? (
              <span className={cn(getBadgeClasses("success"), "px-3 py-1 rounded-full")}>
                Ativo
              </span>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={handleEnablePush}
                className="rounded-lg h-9 text-xs font-display font-bold uppercase"
                disabled={pushLoading}
              >
                {pushLoading && (
                  <IconLoader2 className="h-3 w-3 animate-spin mr-2" />
                )}
                Ativar
              </Button>
            )
          ) : (
            <span className="text-xs text-muted-foreground">N/A</span>
          )}
        </div>
        {pushError && !isPushEnabled && (
          <p className="text-xs text-destructive font-medium">
            {pushError}
          </p>
        )}

        {/* Theme */}
        <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <IconShield className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-display font-bold text-foreground">
              Tema
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Language */}
        <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
          <p className="text-sm font-display font-bold text-foreground">
            Idioma
          </p>
          <LanguageSelector />
        </div>

        {/* Legal Links */}
        <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
          <p className="text-sm font-display font-bold text-foreground">
            Legal
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium text-xs font-display font-bold uppercase tracking-widest transition-colors"
            >
              Termos
            </a>
            <span className="text-border/50">/</span>
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium text-xs font-display font-bold uppercase tracking-widest transition-colors"
            >
              Privacidade
            </a>
          </div>
        </div>
      </section>

      {/* Account Actions */}
      <section className="space-y-3 pt-6 border-t border-border/30 mt-8">
        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-11 rounded-2xl font-display font-bold uppercase text-sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <IconLogout className="h-4 w-4 mr-2" />
          {t.auth.logout}
        </Button>

        {/* Delete Account */}
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-2xl font-display font-bold uppercase text-sm"
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Apagar conta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border shadow-elevated rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-black uppercase tracking-tighter">
                Apagar conta?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Esta ação é irreversível. Todos os seus dados serão
                apagados permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="rounded-2xl font-display font-bold uppercase"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="rounded-2xl font-display font-bold uppercase"
              >
                {isDeleting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <IconTrash className="h-4 w-4 mr-2" />
                    Apagar permanentemente
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-xs text-muted-foreground font-display font-bold uppercase tracking-widest">
          {APP_NAME} v1.0.0
        </p>
      </div>
    </TabsContent>
  );
}

// SeniorToken (SENT) Constants

export const APP_NAME = "IdosoLink";
export const APP_TAGLINE = "Care, Trust & Value on-chain";
export const APP_DESCRIPTION = "O primeiro ecossistema global de cuidados para idosos que une família, cuidador e tecnologia.";

// Token Economics
export const TOKEN_NAME = "SeniorToken";
export const TOKEN_SYMBOL = "SENT";
export const TOKEN_DECIMALS = 18;

// Activation Costs (in cents)
export const ACTIVATION_COST_EUR_CENTS = 3500; // €35 (updated from €25)
export const CONTRACT_FEE_EUR_CENTS = 500; // €5 per side
export const PLATFORM_FEE_PERCENT = 10; // 10% (updated from 15%)

// Token Price (initial: 1 SENT = €0.01)
export const INITIAL_TOKEN_PRICE_EUR_CENTS = 1; // 1 cent per token

// Blockchain
export const POLYGON_CHAIN_ID = 137; // Mainnet
export const POLYGON_MUMBAI_CHAIN_ID = 80001; // Testnet

// Supported Languages
export const SUPPORTED_LANGUAGES = ["pt", "en", "it"] as const;
export const DEFAULT_LANGUAGE = "pt";

// Service Types (for caregivers)
export const SERVICE_TYPES = {
  PERSONAL_CARE: "Cuidados Pessoais",
  MEDICATION: "Administração de Medicação",
  MOBILITY: "Ajuda com Mobilidade",
  COMPANIONSHIP: "Companhia",
  MEAL_PREPARATION: "Preparo de Refeições",
  LIGHT_HOUSEWORK: "Tarefas Domésticas Leves",
  TRANSPORTATION: "Transporte",
  COGNITIVE_SUPPORT: "Estimulação Cognitiva",
  NIGHT_CARE: "Cuidados Noturnos",
  PALLIATIVE_CARE: "Cuidados Paliativos",
  PHYSIOTHERAPY: "Fisioterapia",
  NURSING_CARE: "Enfermagem",
} as const;

// User Roles
export const USER_ROLES = {
  FAMILY: "Familiar",
  CAREGIVER: "Cuidador",
  ADMIN: "Administrador",
} as const;

// Contract Status
export const CONTRACT_STATUS = {
  DRAFT: "Rascunho",
  PENDING_ACCEPTANCE: "Aguardando Aceite",
  PENDING_PAYMENT: "Aguardando Pagamento",
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  DISPUTED: "Em Disputa",
} as const;

// Navigation Links
export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/como-funciona", label: "Como Funciona" },
  { href: "/familias", label: "Para Famílias" },
  { href: "/cuidadores", label: "Para Cuidadores" },
  { href: "/token", label: "SeniorToken" },
  { href: "/sobre", label: "Sobre" },
] as const;

// App Navigation (for logged in users)
export const APP_NAV_LINKS_FAMILY = [
  { href: "/app/dashboard", label: "Dashboard", icon: "home" },
  { href: "/app/search", label: "Buscar Cuidadores", icon: "search" },
  { href: "/app/contracts", label: "Meus Contratos", icon: "file" },
  { href: "/app/wallet", label: "Carteira", icon: "wallet" },
  { href: "/app/chat", label: "Mensagens", icon: "chat" },
  { href: "/app/settings", label: "Configurações", icon: "settings" },
] as const;

export const APP_NAV_LINKS_CAREGIVER = [
  { href: "/app/dashboard", label: "Dashboard", icon: "home" },
  { href: "/app/contracts", label: "Meus Contratos", icon: "file" },
  { href: "/app/wallet", label: "Carteira", icon: "wallet" },
  { href: "/app/chat", label: "Mensagens", icon: "chat" },
  { href: "/app/profile", label: "Meu Perfil", icon: "user" },
  { href: "/app/settings", label: "Configurações", icon: "settings" },
] as const;

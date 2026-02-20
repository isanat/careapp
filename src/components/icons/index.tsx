"use client";

import { 
  Heart, 
  Users, 
  Shield, 
  Star, 
  Wallet, 
  FileText, 
  MessageSquare, 
  Settings, 
  Search, 
  Home,
  User,
  Clock,
  MapPin,
  Phone,
  Mail,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ArrowLeft,
  Euro,
  Coins,
  Gift,
  Calendar,
  Bell,
  LogOut,
  Eye,
  EyeOff,
  Upload,
  Camera,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Filter,
  SortAsc,
  Globe,
  Moon,
  Sun,
  Video,
  MoreVertical,
  Send,
  Briefcase,
  Loader2,
  IdCard,
  Handshake,
  Book,
  Smartphone,
  Building,
  CreditCard,
  Pill
} from "lucide-react";

// Custom Icons for IdosoLink
export function IconLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M20 14c-1.105 0-2 .895-2 2v2h-2c-1.105 0-2 .895-2 2s.895 2 2 2h2v2c0 1.105.895 2 2 2s2-.895 2-2v-2h2c1.105 0 2-.895 2-2s-.895-2-2-2h-2v-2c0-1.105-.895-2-2-2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconToken({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="currentColor"
      >
        S
      </text>
    </svg>
  );
}

export function IconCare({ className }: { className?: string }) {
  return <Heart className={className} />;
}

export function IconFamily({ className }: { className?: string }) {
  return <Users className={className} />;
}

export function IconCaregiver({ className }: { className?: string }) {
  return <User className={className} />;
}

export function IconTrust({ className }: { className?: string }) {
  return <Shield className={className} />;
}

export function IconReputation({ className }: { className?: string }) {
  return <Star className={className} />;
}

export function IconWallet({ className }: { className?: string }) {
  return <Wallet className={className} />;
}

export function IconContract({ className }: { className?: string }) {
  return <FileText className={className} />;
}

export function IconChat({ className }: { className?: string }) {
  return <MessageSquare className={className} />;
}

export function IconSettings({ className }: { className?: string }) {
  return <Settings className={className} />;
}

export function IconSearch({ className }: { className?: string }) {
  return <Search className={className} />;
}

export function IconHome({ className }: { className?: string }) {
  return <Home className={className} />;
}

export function IconUser({ className }: { className?: string }) {
  return <User className={className} />;
}

export function IconClock({ className }: { className?: string }) {
  return <Clock className={className} />;
}

export function IconLocation({ className }: { className?: string }) {
  return <MapPin className={className} />;
}

export function IconPhone({ className }: { className?: string }) {
  return <Phone className={className} />;
}

export function IconMail({ className }: { className?: string }) {
  return <Mail className={className} />;
}

export function IconLock({ className }: { className?: string }) {
  return <Lock className={className} />;
}

export function IconChevronRight({ className }: { className?: string }) {
  return <ChevronRight className={className} />;
}

export function IconChevronLeft({ className }: { className?: string }) {
  return <ChevronLeft className={className} />;
}

export function IconChevronDown({ className }: { className?: string }) {
  return <ChevronDown className={className} />;
}

export function IconMenu({ className }: { className?: string }) {
  return <Menu className={className} />;
}

export function IconClose({ className }: { className?: string }) {
  return <X className={className} />;
}

// Alias for IconClose (common naming pattern)
export function IconX({ className }: { className?: string }) {
  return <X className={className} />;
}

// IconHeart alias
export function IconHeart({ className }: { className?: string }) {
  return <Heart className={className} />;
}

// IconMapPin alias
export function IconMapPin({ className }: { className?: string }) {
  return <MapPin className={className} />;
}

export function IconCheck({ className }: { className?: string }) {
  return <Check className={className} />;
}

export function IconAlert({ className }: { className?: string }) {
  return <AlertCircle className={className} />;
}

export function IconInfo({ className }: { className?: string }) {
  return <Info className={className} />;
}

export function IconHelp({ className }: { className?: string }) {
  return <HelpCircle className={className} />;
}

export function IconExternalLink({ className }: { className?: string }) {
  return <ExternalLink className={className} />;
}

export function IconCopy({ className }: { className?: string }) {
  return <Copy className={className} />;
}

export function IconQrCode({ className }: { className?: string }) {
  return <QrCode className={className} />;
}

export function IconArrowUp({ className }: { className?: string }) {
  return <ArrowUpRight className={className} />;
}

export function IconArrowDown({ className }: { className?: string }) {
  return <ArrowDownLeft className={className} />;
}

export function IconArrowRight({ className }: { className?: string }) {
  return <ArrowRight className={className} />;
}

export function IconArrowLeft({ className }: { className?: string }) {
  return <ArrowLeft className={className} />;
}

export function IconEuro({ className }: { className?: string }) {
  return <Euro className={className} />;
}

export function IconCoins({ className }: { className?: string }) {
  return <Coins className={className} />;
}

export function IconGift({ className }: { className?: string }) {
  return <Gift className={className} />;
}

export function IconCalendar({ className }: { className?: string }) {
  return <Calendar className={className} />;
}

export function IconBell({ className }: { className?: string }) {
  return <Bell className={className} />;
}

export function IconLogout({ className }: { className?: string }) {
  return <LogOut className={className} />;
}

export function IconEye({ className }: { className?: string }) {
  return <Eye className={className} />;
}

export function IconEyeOff({ className }: { className?: string }) {
  return <EyeOff className={className} />;
}

export function IconUpload({ className }: { className?: string }) {
  return <Upload className={className} />;
}

export function IconCamera({ className }: { className?: string }) {
  return <Camera className={className} />;
}

export function IconEdit({ className }: { className?: string }) {
  return <Edit className={className} />;
}

export function IconTrash({ className }: { className?: string }) {
  return <Trash2 className={className} />;
}

export function IconPlus({ className }: { className?: string }) {
  return <Plus className={className} />;
}

export function IconMinus({ className }: { className?: string }) {
  return <Minus className={className} />;
}

export function IconRefresh({ className }: { className?: string }) {
  return <RefreshCw className={className} />;
}

export function IconLoader2({ className }: { className?: string }) {
  return <Loader2 className={className} />;
}

export function IconFilter({ className }: { className?: string }) {
  return <Filter className={className} />;
}

export function IconSort({ className }: { className?: string }) {
  return <SortAsc className={className} />;
}

export function IconGlobe({ className }: { className?: string }) {
  return <Globe className={className} />;
}

export function IconMoon({ className }: { className?: string }) {
  return <Moon className={className} />;
}

export function IconSun({ className }: { className?: string }) {
  return <Sun className={className} />;
}

// Additional aliases for common usage patterns
export function IconShield({ className }: { className?: string }) {
  return <Shield className={className} />;
}

export function IconStar({ className }: { className?: string }) {
  return <Star className={className} />;
}

export function IconVideo({ className }: { className?: string }) {
  return <Video className={className} />;
}

export function IconMoreVertical({ className }: { className?: string }) {
  return <MoreVertical className={className} />;
}

export function IconSend({ className }: { className?: string }) {
  return <Send className={className} />;
}

export function IconBriefcase({ className }: { className?: string }) {
  return <Briefcase className={className} />;
}

export function IconId({ className }: { className?: string }) {
  return <IdCard className={className} />;
}

export function IconFile({ className }: { className?: string }) {
  return <FileText className={className} />;
}

export function IconHandshake({ className }: { className?: string }) {
  return <Handshake className={className} />;
}

export function IconBook({ className }: { className?: string }) {
  return <Book className={className} />;
}

export function IconSmartphone({ className }: { className?: string }) {
  return <Smartphone className={className} />;
}

export function IconBuilding({ className }: { className?: string }) {
  return <Building className={className} />;
}

export function IconCreditCard({ className }: { className?: string }) {
  return <CreditCard className={className} />;
}

export function IconPill({ className }: { className?: string }) {
  return <Pill className={className} />;
}

export function IconAlertCircle({ className }: { className?: string }) {
  return <AlertCircle className={className} />;
}

// Re-export all lucide icons for convenience
export {
  Heart,
  Users,
  Shield,
  Star,
  Wallet,
  FileText,
  MessageSquare,
  Settings,
  Search,
  Home,
  User,
  Clock,
  MapPin,
  Phone,
  Mail,
  Lock,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ArrowLeft,
  Euro,
  Coins,
  Gift,
  Calendar,
  Bell,
  LogOut,
  Eye,
  EyeOff,
  Upload,
  Camera,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Filter,
  SortAsc,
  Globe,
  Moon,
  Sun,
  Video,
  MoreVertical,
  Send,
  Loader2,
  IdCard,
  Handshake,
  Book,
  Smartphone,
  Building,
  CreditCard,
  Pill,
};

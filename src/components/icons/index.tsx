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
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
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
  Activity,
  UserX,
  UserCheck,
  LayoutDashboard,
  HeartHandshake,
  BarChart,
  FileSearch,
  Headphones,
  TrendingUp,
  TrendingDown,
  Download,
  Flag,
  MoreHorizontal,
  MoreVertical,
  Percent,
  Server,
  Briefcase,
  StarOff,
  SlidersHorizontal,
  SortAsc,
  Globe,
  Moon,
  Sun,
  Video,
  Send,
  Loader2,
  IdCard,
  Handshake,
  Book,
  Smartphone,
  Building,
  CreditCard,
  Pill,
  PhoneOff,
  VideoOff,
  Mic,
  MicOff,
  Inbox,
} from "lucide-react";

// Senior Care App - Custom Icons
export function IconLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle with gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2F6F6D" />
          <stop offset="100%" stopColor="#1a4f4d" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#logoGradient)" />
      {/* Heart shape */}
      <path
        d="M20 30 C10 22 6 16 6 12 C6 8 9 5 13 5 C16 5 18 7 20 10 C22 7 24 5 27 5 C31 5 34 8 34 12 C34 16 30 22 20 30Z"
        fill="white"
        opacity="0.95"
      />
      {/* Small caring hands icon inside */}
      <path
        d="M16 16 C16 14 18 12.5 20 13.5 L20 18 L14 18 C14 16.5 15 15.5 16 16Z"
        fill="#2F6F6D"
        opacity="0.7"
      />
      <path
        d="M24 16 C24 14 22 12.5 20 13.5 L20 18 L26 18 C26 16.5 25 15.5 24 16Z"
        fill="#2F6F6D"
        opacity="0.7"
      />
    </svg>
  );
}

// Logo with text for headers
export function IconLogoFull({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <IconLogo className="h-8 w-8 text-primary" />
      <span className="font-bold text-xl">
        <span className="text-primary">Senior</span>
        <span className="text-foreground"> Care</span>
      </span>
    </div>
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

export function IconUsers({ className }: { className?: string }) {
  return <Users className={className} />;
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

export function IconLoader2({ className }: { className?: string }) {
  return <Loader2 className={className} />;
}

export function IconTrendingUp({ className }: { className?: string }) {
  return <TrendingUp className={className} />;
}

export function IconTrendingDown({ className }: { className?: string }) {
  return <TrendingDown className={className} />;
}

export function IconDownload({ className }: { className?: string }) {
  return <Download className={className} />;
}

export function IconFlag({ className }: { className?: string }) {
  return <Flag className={className} />;
}

export function IconMessageSquare({ className }: { className?: string }) {
  return <MessageSquare className={className} />;
}

export function IconMoreHorizontal({ className }: { className?: string }) {
  return <MoreHorizontal className={className} />;
}

export function IconPercentage({ className }: { className?: string }) {
  return <Percent className={className} />;
}

export function IconServer({ className }: { className?: string }) {
  return <Server className={className} />;
}

export function IconStarOff({ className }: { className?: string }) {
  return <StarOff className={className} />;
}

export function IconAdjustments({ className }: { className?: string }) {
  return <SlidersHorizontal className={className} />;
}

export function IconCoin({ className }: { className?: string }) {
  return <Coins className={className} />;
}

export function IconChevronsLeft({ className }: { className?: string }) {
  return <ChevronsLeft className={className} />;
}

export function IconChevronsRight({ className }: { className?: string }) {
  return <ChevronsRight className={className} />;
}

export function IconAlertTriangle({ className }: { className?: string }) {
  return <AlertTriangle className={className} />;
}

export function IconLoader({ className }: { className?: string }) {
  return <Loader2 className={className} />;
}

// Additional icons needed for admin pages
export function IconRefresh({ className }: { className?: string }) {
  return <RefreshCw className={className} />;
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

export function IconShield({ className }: { className?: string }) {
  return <Shield className={className} />;
}

export function IconStar({ className }: { className?: string }) {
  return <Star className={className} />;
}

export function IconActivity({ className }: { className?: string }) {
  return <Activity className={className} />;
}

export function IconUserOff({ className }: { className?: string }) {
  return <UserX className={className} />;
}

export function IconUserCheck({ className }: { className?: string }) {
  return <UserCheck className={className} />;
}

export function IconLayoutDashboard({ className }: { className?: string }) {
  return <LayoutDashboard className={className} />;
}

export function IconHeartHandshake({ className }: { className?: string }) {
  return <HeartHandshake className={className} />;
}

export function IconBarChart({ className }: { className?: string }) {
  return <BarChart className={className} />;
}

export function IconFileSearch({ className }: { className?: string }) {
  return <FileSearch className={className} />;
}

export function IconHeadphones({ className }: { className?: string }) {
  return <Headphones className={className} />;
}

export function IconFileText({ className }: { className?: string }) {
  return <FileText className={className} />;
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

// Additional icons for admin and app pages
export function IconFile({ className }: { className?: string }) {
  return <FileText className={className} />;
}

export function IconAlertCircle({ className }: { className?: string }) {
  return <AlertCircle className={className} />;
}

export function IconBriefcase({ className }: { className?: string }) {
  return <Briefcase className={className} />;
}

export function IconId({ className }: { className?: string }) {
  return <IdCard className={className} />;
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

export function IconPhoneOff({ className }: { className?: string }) {
  return <PhoneOff className={className} />;
}

export function IconVideoOff({ className }: { className?: string }) {
  return <VideoOff className={className} />;
}

export function IconMic({ className }: { className?: string }) {
  return <Mic className={className} />;
}

export function IconMicOff({ className }: { className?: string }) {
  return <MicOff className={className} />;
}

export function IconInbox({ className }: { className?: string }) {
  return <Inbox className={className} />;
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
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
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
  MoreHorizontal,
  Send,
  Loader2,
  IdCard,
  Handshake,
  Book,
  Smartphone,
  Building,
  CreditCard,
  Pill,
  Activity,
  UserX,
  UserCheck,
  LayoutDashboard,
  HeartHandshake,
  BarChart,
  FileSearch,
  Headphones,
  TrendingUp,
  TrendingDown,
  Download,
  Flag,
  Percent,
  Server,
  Briefcase,
  StarOff,
  SlidersHorizontal,
  PhoneOff,
  VideoOff,
  Mic,
  MicOff,
  Inbox,
};

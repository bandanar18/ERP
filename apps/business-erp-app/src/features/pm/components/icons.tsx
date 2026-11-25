import Svg, { Path } from 'react-native-svg';
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  Banknote,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  FolderPlus,
  Info,
  Landmark,
  LayoutDashboard,
  List,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Medal,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Phone,
  Plus,
  Power,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Shield,
  ShoppingCart,
  Sliders,
  Table,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Iconos del módulo PM — todos re-exportados del set oficial Lucide
 * (lucide-react-native). Mismos nombres que antes, ahora sin SVG casero.
 */

/* ─── Re-exports de Lucide (alias con sufijo Icon) ─────────────────── */

export {
  AlertCircle as AlertCircleIcon,
  ArrowUpRight as ArrowUpRightIcon,
  Award as AwardIcon,
  Banknote as BanknoteIcon,
  Building2 as BuildingIcon,
  Calendar as CalendarIcon,
  Check as CheckIcon,
  CheckCircle2 as CheckCircle2Icon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CircleDollarSign as DollarIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  FileText as FileTextIcon,
  Filter as FilterIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  FolderPlus as FolderPlusIcon,
  Info as InfoIcon,
  Landmark as LandmarkIcon,
  LayoutDashboard as LayoutDashboardIcon,
  List as ListIcon,
  Lock as LockIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Medal as MedalIcon,
  PanelLeftClose as PanelLeftCloseIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
  Pencil as PencilIcon,
  Phone as PhoneIcon,
  Plus as PlusIcon,
  Power as PowerIcon,
  Printer as PrinterIcon,
  Receipt as ReceiptIcon,
  RotateCcw as RotateCcwIcon,
  Search as SearchIcon,
  Shield as ShieldIcon,
  ShoppingCart as ShoppingCartIcon,
  Sliders as SlidersIcon,
  Table as TableIcon,
  Trash2 as Trash2Icon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  ExternalLink as ExternalLinkIcon,
  Minus as MinusIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  User as UserIcon,
  UserCog as UserCogIcon,
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
  X as XIcon,
} from 'lucide-react-native';

/* ─── Logo de Google (no está en Lucide: paths oficiales de 4 colores) ── */

export function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}
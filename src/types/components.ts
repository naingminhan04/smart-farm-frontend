import type { ChartData, ChartOptions } from "chart.js";
import type { AdminUser, DoorState, IntruderAlertRecord, OAuthProvider, TempHumiRecord } from ".";
import type { AppTab, AuthTab } from "./app";
import type { ViewerItem } from "./feature";

export type AuthModalProps = {
  admin: AdminUser | null;
  authError: string | null;
  authMethodLabel: string;
  authPassword: string;
  authProvider: OAuthProvider | "password" | null;
  authSubmitting: boolean;
  authTab: AuthTab;
  authUsername: string;
  isOpen: boolean;
  onAuthPasswordChange: (value: string) => void;
  onAuthTabChange: (tab: AuthTab) => void;
  onAuthUsernameChange: (value: string) => void;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onRegister: () => void;
  onStartOauth: (provider: OAuthProvider) => void;
  onClearAuthError: () => void;
};

export type CardsPanelProps = {
  admin: AdminUser | null;
  authChecking: boolean;
  cardSubmitting: boolean;
  cards: string[];
  editingCardNum: string | null;
  editingValue: string;
  newCardNum: string;
  onAddCard: () => void;
  onDeleteCard: (cardNum: string) => void;
  onEditCard: (cardNum: string) => void;
  onNewCardNumChange: (value: string) => void;
  onSaveEdit: (cardNum: string) => void;
  onCancelEdit: () => void;
  onEditingValueChange: (value: string) => void;
};

export type DashboardHeaderProps = {
  activeTab: AppTab;
  admin: AdminUser | null;
  onTabChange: (tab: AppTab) => void;
  onOpenAdminSession: () => void;
  onOpenAdminLogin: () => void;
};

export type DashboardOverviewProps = {
  latest: TempHumiRecord | null;
  history: TempHumiRecord[];
  intruderAlertHistory: IntruderAlertRecord[];
  busy: boolean;
  doorState: string;
  showTempFull: boolean;
  showHumiFull: boolean;
  tempRecentData: ChartData<"line">;
  tempFullData: ChartData<"line">;
  humiRecentData: ChartData<"line">;
  humiFullData: ChartData<"line">;
  chartOptions: ChartOptions<"line">;
  chartReady: boolean;
  admin: AdminUser | null;
  authChecking: boolean;
  cardSubmitting: boolean;
  cards: string[];
  editingCardNum: string | null;
  editingValue: string;
  newCardNum: string;
  onDoorChange: (state: DoorState) => void;
  onShowTempRecent: () => void;
  onShowTempFull: () => void;
  onShowHumiRecent: () => void;
  onShowHumiFull: () => void;
  onAddCard: () => void;
  onDeleteCard: (cardNum: string) => void;
  onEditCard: (cardNum: string) => void;
  onNewCardNumChange: (value: string) => void;
  onSaveEdit: (cardNum: string) => void;
  onCancelEdit: () => void;
  onEditingValueChange: (value: string) => void;
  onOpenAdminLogin: () => void;
};

export type DoorControlCardProps = {
  busy: boolean;
  doorState: string;
  onDoorChange: (state: DoorState) => void;
};

export type FeatureCardProps = {
  title: string;
  body: string;
  href: string;
};

export type FeatureImageViewerProps = {
  item: ViewerItem | null;
  zoom: number;
  onClose: () => void;
  onWheelZoom: (deltaY: number) => void;
};

export type HistoryChartCardProps = {
  title: string;
  totalPoints: number;
  showingFull: boolean;
  recentData: ChartData<"line">;
  fullData: ChartData<"line">;
  options: ChartOptions<"line">;
  chartReady?: boolean;
  animationDelayClass?: string;
  onShowRecent: () => void;
  onShowFull: () => void;
};

export type IntruderAlertHistoryPanelProps = {
  alerts: IntruderAlertRecord[];
  admin: AdminUser | null;
  authChecking: boolean;
  onOpenAdminLogin: () => void;
};

export type IntruderAlertModalProps = {
  alert: IntruderAlertRecord | null;
  canPlaySound: boolean;
  busy?: boolean;
  onAcknowledge: () => void;
  onDialEmergency: () => void;
};

export type MetricCardProps = {
  title: string;
  value: string;
  unit: string;
  animationDelayClass?: string;
};

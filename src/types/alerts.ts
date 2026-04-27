export interface IntruderAlertAdminUser {
  id: number;
  username: string;
}

export interface IntruderAlertRecord {
  id: number;
  source: string;
  message: string;
  detectedAt: string;
  clearedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedById?: number | null;
  acknowledgedBy?: IntruderAlertAdminUser | null;
  acknowledgedByUsername?: string | null;
  emergencyDialedAt: string | null;
  emergencyDialedById?: number | null;
  emergencyDialedBy?: IntruderAlertAdminUser | null;
  emergencyDialedByUsername?: string | null;
  createdAt: string;
  updatedAt: string;
  requiresAction: boolean;
}

export interface IntruderAlertFeed {
  activeAlert: IntruderAlertRecord | null;
  history: IntruderAlertRecord[];
}

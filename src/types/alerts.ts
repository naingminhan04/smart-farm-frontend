export interface IntruderAlertRecord {
  id: number;
  source: string;
  message: string;
  detectedAt: string;
  clearedAt: string | null;
  acknowledgedAt: string | null;
  emergencyDialedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requiresAction: boolean;
}

export interface IntruderAlertFeed {
  activeAlert: IntruderAlertRecord | null;
  history: IntruderAlertRecord[];
}

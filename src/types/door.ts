export type DoorState = "ON" | "OFF";

export type DoorStateResponse = {
  state: string;
};

export type DoorStateUpdateResponse = {
  id: number;
  state: string;
  createdAt: string;
};

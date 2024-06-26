/* eslint-disable class-methods-use-this */
import { DataProvider } from "./DataProvider";
import { AttributeStore } from "./AttributeStore";
import { AppEvent, AppEventHandler } from "./AppEvent";
import {
  ProjectID,
  Fleets,
  FleetID,
  DeviceEnvVars,
  FleetEnvVars,
  ValveMonitorDevice,
  ValveMonitorConfig,
} from "./AppModel";
import { IDBuilder } from "./IDBuilder";
import { NotificationsStore, Notification } from "./NotificationsStore";
import { serverLogError } from "../pages/api/log";
import { AppNotification } from "../components/presentation/notifications";
import { ALARM, NOTIFICATION } from "./NotificationEventHandler";

// this class / interface combo passes data and functions to the service locator file
interface AppServiceInterface {
  setDeviceName: (deviceUID: string, name: string) => Promise<void>;
  getValveMonitorDeviceData: () => Promise<ValveMonitorDevice[]>;
  setDeviceValveMonitorConfig: (
    deviceUID: string,
    valveMonitorConfig: ValveMonitorConfig
  ) => Promise<void>;
  updateValveState: (deviceUID: string, state: string) => Promise<void>;

  handleEvent(event: AppEvent): Promise<void>;
  getFleetsByDevice: (deviceUID: string) => Promise<Fleets>;
  getDeviceEnvVars: (deviceUID: string) => Promise<DeviceEnvVars>;
  getFleetEnvVars: (fleetUID: string) => Promise<FleetEnvVars>;

  getValveMonitorConfig: () => Promise<ValveMonitorConfig>;
  setValveMonitorConfig: (
    valveMonitorConfig: ValveMonitorConfig
  ) => Promise<void>;

  getAppNotifications(): Promise<AppNotification[]>;
  clearAlarms(): Promise<void>;
}

export type { AppServiceInterface };

export default class AppService implements AppServiceInterface {
  private projectID: ProjectID;

  private fleetID: FleetID;

  constructor(
    projectUID: string,
    fleetUID: string,
    private readonly idBuilder: IDBuilder,
    private dataProvider: DataProvider,
    private appEventHandler: AppEventHandler,
    private attributeStore: AttributeStore,
    private notificationStore: NotificationsStore
  ) {
    this.projectID = this.idBuilder.buildProjectID(projectUID);
    this.fleetID = this.idBuilder.buildFleetID(fleetUID);
  }

  async setDeviceName(deviceUID: string, name: string): Promise<void> {
    return this.attributeStore.updateDeviceName(
      this.idBuilder.buildDeviceID(deviceUID),
      name
    );
  }

  async getValveMonitorDeviceData() {
    return this.dataProvider.getValveMonitorDeviceData();
  }

  async setDeviceValveMonitorConfig(
    deviceUID: string,
    valveMonitorConfig: ValveMonitorConfig
  ): Promise<void> {
    return this.attributeStore.updateDeviceValveMonitorConfig(
      deviceUID,
      valveMonitorConfig
    );
  }

  async getFleetsByDevice(deviceUID: string) {
    return this.dataProvider.getFleetsByDevice(deviceUID);
  }

  async getDeviceEnvVars(deviceUID: string) {
    return this.dataProvider.getDeviceEnvVars(deviceUID);
  }

  async getFleetEnvVars(fleetUID: string) {
    return this.dataProvider.getFleetEnvVars(fleetUID);
  }

  async handleEvent(event: AppEvent) {
    return this.appEventHandler.handleEvent(event);
  }

  async getAppNotifications(): Promise<AppNotification[]> {
    const notifications: Notification[] =
      await this.notificationStore.getNotifications();
    const result = (
      await Promise.all(notifications.map(async (n) => this.appNotification(n)))
    ).filter((e): e is AppNotification => e !== null);
    return result;
  }

  async getValveMonitorConfig() {
    return this.dataProvider.getValveMonitorConfig(this.fleetID.fleetUID);
  }

  async setValveMonitorConfig(valveMonitorConfig: ValveMonitorConfig) {
    return this.attributeStore.updateValveMonitorConfig(
      this.fleetID,
      valveMonitorConfig
    );
  }

  async updateValveState(deviceUID: string, state: string) {
    return this.attributeStore.updateValveState(deviceUID, state);
  }

  async clearAlarms() {
    await this.notificationStore.removeNotificationsByType(ALARM);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async appNotification(
    notification: Notification
  ): Promise<AppNotification | null> {
    // build models here to handle different types of notifications
    switch (true) {
      case notification.type === ALARM:
        return {
          id: notification.id,
          type: ALARM,
          when: notification.when.getTime(),
        };
      case notification.type === NOTIFICATION:
        // The only notification this project currently uses are for
        // environment variable updates, which we’re ignoring in the
        // web app
        return null;
      default:
        serverLogError(`unknown notification ${notification}`);
        return null;
    }
  }
}


/**
 * Cloud Intelligence & Data Persistence Service
 * This layer abstracts the underlying storage (LocalStorage for now, Cloud later)
 * to support Multi-Tenancy and Automated Logistics.
 */

const CLOUD_LATENCY = 800;

export class MotoFleetCloud {
  private fleetId: string;

  constructor(fleetId: string) {
    this.fleetId = fleetId;
  }

  private getStorageKey(key: string): string {
    return `fleet_${this.fleetId}_${key}`;
  }

  async fetch<T>(key: string, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const saved = localStorage.getItem(this.getStorageKey(key));
        resolve(saved ? JSON.parse(saved) : defaultValue);
      }, CLOUD_LATENCY);
    });
  }

  async persist<T>(key: string, data: T): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
        resolve();
      }, CLOUD_LATENCY / 2);
    });
  }

  /**
   * Automated Notification Engine Simulation
   * Checks for arrears and maintenance needs
   */
  async triggerAutomationCheck(data: any): Promise<any[]> {
    const { drivers, payments, weeklyTarget } = data;
    const notifications: any[] = [];
    
    // Logic for finding arrears
    drivers.forEach((d: any) => {
       const totalPaid = payments
         .filter((p: any) => p.driverId === d.id)
         .reduce((acc: number, p: any) => acc + p.amount, 0);
       
       if (totalPaid < weeklyTarget) {
         notifications.push({
           id: `notif-${Date.now()}-${d.id}`,
           type: 'arrears',
           recipientId: d.id,
           status: 'queued',
           timestamp: new Date().toISOString(),
           message: `Automated System Alert: ${d.name}, your account is in arrears of R${weeklyTarget - totalPaid}.`
         });
       }
    });

    return notifications;
  }
}

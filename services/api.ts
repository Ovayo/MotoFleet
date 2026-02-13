
/**
 * Cloud Intelligence & Data Persistence Service
 * This layer abstracts the underlying storage to support Multi-Tenancy.
 */

const CLOUD_LATENCY = 800;

export class MotoFleetCloud {
  private fleetId: string;

  constructor(fleetId: string) {
    this.fleetId = fleetId;
  }

  /**
   * The canonical key for v2 multi-tenancy
   */
  private getSiloKey(key: string): string {
    return `mf_v2_${this.fleetId}_${key}`;
  }

  /**
   * Scans browser local storage for any legacy data formats to prevent data loss
   */
  private findLegacyData(key: string): string | null {
    const legacyPatterns = [
      `fleet_${this.fleetId}_${key}`,  // Potential double-prefix bug from early v2
      `${this.fleetId}_${key}`,        // v1 multi-tenant format
      key                              // Original single-fleet format
    ];

    for (const lKey of legacyPatterns) {
      const data = localStorage.getItem(lKey);
      if (data && data !== '[]' && data !== '{}') {
        console.log(`[Cloud Sync] Legacy data discovered in "${lKey}". Recovering to silo...`);
        return data;
      }
    }
    return null;
  }

  async fetch<T>(key: string, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      const siloKey = this.getSiloKey(key);
      let saved = localStorage.getItem(siloKey);

      // If nothing in the main silo, try to find and migrate legacy data
      if (!saved || saved === '[]') {
        const legacy = this.findLegacyData(key);
        if (legacy) {
          localStorage.setItem(siloKey, legacy);
          saved = legacy;
        }
      }

      setTimeout(() => {
        try {
          resolve(saved ? JSON.parse(saved) : defaultValue);
        } catch (e) {
          console.error("Parse error for key:", siloKey);
          resolve(defaultValue);
        }
      }, CLOUD_LATENCY);
    });
  }

  async persist<T>(key: string, data: T): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(this.getSiloKey(key), JSON.stringify(data));
        resolve();
      }, 100); // Fast local persistence
    });
  }

  /**
   * Automated Notification Engine Simulation
   */
  async triggerAutomationCheck(data: any): Promise<any[]> {
    const { drivers, payments, weeklyTarget } = data;
    const notifications: any[] = [];
    
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
           message: `Automated Alert: Operator ${d.name}, account balance check required. Current weekly collection target is R${weeklyTarget}.`
         });
       }
    });

    return notifications;
  }
}

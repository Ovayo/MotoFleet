
/**
 * Cloud Intelligence & Data Persistence Service
 * This layer abstracts the underlying storage to support Multi-Tenancy.
 */

const CLOUD_LATENCY = 600;

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
   * Exhaustive scan of browser local storage for any legacy data formats to prevent data loss.
   * Checks multiple common prefixes used in previous versions of the application.
   */
  private findLegacyData(key: string): string | null {
    const legacyPatterns = [
      `mf_v2_${this.fleetId}_${key}`,     // Self-check
      `motofleet_${key}`,                // v1 Global prefix
      `fleet_${this.fleetId}_${key}`,    // Early v2 prefix
      `${this.fleetId}_${key}`,          // Simple tenant prefix
      key                                // No prefix (Legacy raw)
    ];

    for (const lKey of legacyPatterns) {
      try {
        const data = localStorage.getItem(lKey);
        // We only migrate if the data is a non-empty array or non-empty object
        if (data && data !== '[]' && data !== '{}' && data !== 'null' && data !== 'undefined') {
          console.log(`[Deep Recovery] Found legacy data in "${lKey}". Migrating to silo mf_v2_${this.fleetId}...`);
          return data;
        }
      } catch (e) {
        console.warn(`[Deep Recovery] Error reading legacy key ${lKey}:`, e);
      }
    }
    return null;
  }

  async fetch<T>(key: string, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      const siloKey = this.getSiloKey(key);
      let saved = localStorage.getItem(siloKey);

      // CRITICAL: Check if we have data in the new silo. 
      // If not, or if it's an empty "bot" state, look for legacy data to migrate.
      if (!saved || saved === '[]' || saved === 'null') {
        const legacy = this.findLegacyData(key);
        if (legacy) {
          localStorage.setItem(siloKey, legacy);
          saved = legacy;
        }
      }

      setTimeout(() => {
        try {
          if (!saved) {
            resolve(defaultValue);
            return;
          }
          const parsed = JSON.parse(saved);
          resolve(parsed as T);
        } catch (e) {
          console.error(`[Cloud Sync] Parse error for key: ${siloKey}`, e);
          resolve(defaultValue);
        }
      }, CLOUD_LATENCY);
    });
  }

  async persist<T>(key: string, data: T): Promise<void> {
    if (!data || (Array.isArray(data) && data.length === 0)) {
       // Optional: We could check if we are overwriting actual data with nothing, 
       // but the App.tsx 'isHydrated' guard handles this more cleanly.
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          localStorage.setItem(this.getSiloKey(key), JSON.stringify(data));
        } catch (e) {
          console.error(`[Cloud Sync] Persistence failed for key: ${key}`, e);
        }
        resolve();
      }, 50); // Fast local persistence
    });
  }

  /**
   * Automated Notification Engine Simulation
   */
  async triggerAutomationCheck(data: any): Promise<any[]> {
    const { drivers, payments, weeklyTarget } = data;
    const notifications: any[] = [];
    
    if (!drivers || !payments) return [];

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
           message: `Automated Alert: Operator ${d.name}, account balance check required. Weekly target: R${weeklyTarget}.`
         });
       }
    });

    return notifications;
  }
}

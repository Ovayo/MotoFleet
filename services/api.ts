
/**
 * Cloud Intelligence & Data Persistence Service
 * This layer abstracts the underlying storage to support Multi-Tenancy.
 */

const CLOUD_LATENCY = 400;

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
   * BRUTE FORCE SCANNER: 
   * Searches for ANY key in localStorage that might contain user data.
   */
  private findLegacyDataBruteForce(targetKey: string): string | null {
    const keys = Object.keys(localStorage);
    
    // 1. Try exact matches first with common prefixes
    const prefixes = [`mf_v2_${this.fleetId}_`, `motofleet_`, `fleet_${this.fleetId}_`, 'motofleet_manager_', ''];
    for (const prefix of prefixes) {
      const data = localStorage.getItem(`${prefix}${targetKey}`);
      if (data && data !== '[]' && data !== '{}' && data !== 'null') return data;
    }

    // 2. Brute force search: Find ANY key that ends with or contains the targetKey
    for (const storageKey of keys) {
      if (storageKey.toLowerCase().endsWith(targetKey.toLowerCase())) {
        const data = localStorage.getItem(storageKey);
        if (data && data !== '[]' && data !== '{}' && data !== 'null') {
          console.log(`[Recovery Engine] Brute-force match found: "${storageKey}" -> Migrating to silo...`);
          return data;
        }
      }
    }

    return null;
  }

  async fetch<T>(key: string, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      const siloKey = this.getSiloKey(key);
      let saved = localStorage.getItem(siloKey);

      // If Silo is empty, initiate Brute Force Recovery
      if (!saved || saved === '[]' || saved === 'null') {
        const recovered = this.findLegacyDataBruteForce(key);
        if (recovered) {
          // Immediately secure the recovered data in the new Silo
          localStorage.setItem(siloKey, recovered);
          saved = recovered;
        }
      }

      setTimeout(() => {
        try {
          if (!saved) {
            resolve(defaultValue);
            return;
          }
          const parsed = JSON.parse(saved);
          // Return the array, ensuring it's not null or empty if it's supposed to have initial data
          if ((!parsed || (Array.isArray(parsed) && parsed.length === 0)) && defaultValue) {
             resolve(defaultValue);
          } else {
             resolve(parsed as T);
          }
        } catch (e) {
          console.error(`[Cloud Sync] Critical recovery error for ${key}:`, e);
          resolve(defaultValue);
        }
      }, CLOUD_LATENCY);
    });
  }

  async persist<T>(key: string, data: T): Promise<void> {
    // SECURITY: Prevent overwriting a non-empty storage with an empty array
    // during the critical hydration phase.
    if (Array.isArray(data) && data.length === 0) {
      const existing = localStorage.getItem(this.getSiloKey(key));
      if (existing && existing !== '[]' && existing !== 'null') {
        console.warn(`[Persistence Guard] Blocked empty save to protect existing "${key}" data.`);
        return;
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          localStorage.setItem(this.getSiloKey(key), JSON.stringify(data));
        } catch (e) {
          console.error(`[Cloud Sync] Persistence failed:`, e);
        }
        resolve();
      }, 50);
    });
  }

  async triggerAutomationCheck(data: any): Promise<any[]> {
    const { drivers = [], payments = [], weeklyTarget } = data;
    const notifications: any[] = [];
    
    // Filter out drivers who are no longer working
    const activeDrivers = drivers.filter((d: any) => !d.isArchived);
    
    activeDrivers.forEach((d: any) => {
       const totalPaid = payments
         .filter((p: any) => p?.driverId === d.id)
         .reduce((acc: number, p: any) => acc + (p?.amount || 0), 0);
       
       if (totalPaid < weeklyTarget) {
         notifications.push({
           id: `notif-${Date.now()}-${d.id}`,
           type: 'arrears',
           recipientId: d.id,
           status: 'queued',
           timestamp: new Date().toISOString(),
           message: `Automated Alert: Driver ${d.name}, account balance check required.`
         });
       }
    });

    return notifications;
  }
}

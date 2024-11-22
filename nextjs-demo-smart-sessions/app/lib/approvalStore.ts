import { kv } from "@vercel/kv"

class InMemoryStore {
  private static approvals = new Map<string, boolean>()

  static async get(key: string): Promise<boolean> {
    return this.approvals.get(key) || false
  }

  static async set(key: string, value: boolean): Promise<void> {
    this.approvals.set(key, value)
  }
}

export class ApprovalStore {
  private static readonly PREFIX = "approval:"
  private static readonly isDev = process.env.NODE_ENV === "development"

  public static async isApproved(userAddress: string): Promise<boolean> {
    if (!userAddress) return false

    try {
      if (this.isDev && !process.env.KV_REST_API_URL) {
        return InMemoryStore.get(`${this.PREFIX}${userAddress}`)
      }
      const value = await kv.get<boolean>(`${this.PREFIX}${userAddress}`)
      return !!value
    } catch (error) {
      console.error("Error checking approval status:", error)
      if (this.isDev) {
        return InMemoryStore.get(`${this.PREFIX}${userAddress}`)
      }
      return false
    }
  }

  public static async setApproved(userAddress: string): Promise<void> {
    if (!userAddress) return

    try {
      if (this.isDev && !process.env.KV_REST_API_URL) {
        await InMemoryStore.set(`${this.PREFIX}${userAddress}`, true)
        return
      }
      await kv.set(`${this.PREFIX}${userAddress}`, true)
    } catch (error) {
      console.error("Error setting approval status:", error)
      if (this.isDev) {
        await InMemoryStore.set(`${this.PREFIX}${userAddress}`, true)
      }
    }
  }
}

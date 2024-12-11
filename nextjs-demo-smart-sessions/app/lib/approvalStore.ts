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

  public static async isApproved(userAddress: string): Promise<boolean> {
    if (!userAddress) return false
    return InMemoryStore.get(`${this.PREFIX}${userAddress}`)
  }

  public static async setApproved(userAddress: string): Promise<void> {
    if (!userAddress) return
    await InMemoryStore.set(`${this.PREFIX}${userAddress}`, true)
  }
}

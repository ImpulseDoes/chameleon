export class Chameleon {

  private static lastCpuUsage = process.cpuUsage()
  private static lastCheck = process.hrtime.bigint()

  public static get lifespan() {

    const mem = process.memoryUsage()
    const now = process.hrtime.bigint()
    const usage = process.cpuUsage(this.lastCpuUsage)
    const elapsedUs = Number(now - this.lastCheck) / 1000

    const cpuPercent = ((usage.user + usage.system) / elapsedUs) * 100

    this.lastCpuUsage = process.cpuUsage()
    this.lastCheck = now

    return {
      ram: Math.round(mem.rss / 1024 / 1024),
      uptime: Math.round(process.uptime() * 1000),
      cpu: Math.round(cpuPercent * 100) / 100,
    }
  }
}
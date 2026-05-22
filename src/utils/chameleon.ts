import os from 'node:os'

export class Chameleon {

  public static get lifespan() {

    return {

      get ram() {
        return Math.round(process.memoryUsage().rss / 1024 / 1024)
      },

      get cpu() {
        return os.loadavg()[0]
      }
    }
  }
}
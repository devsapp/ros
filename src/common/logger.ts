export default class GLogger {
  private static instance: any;
  private constructor() {}

  static getLogger(): any {
    if (!GLogger.instance) {
      throw new Error('instance must be init before call getLogger');
    }
    return GLogger.instance;
  }

  static setLogger(logger: any) {
    GLogger.instance = logger;
  }
}

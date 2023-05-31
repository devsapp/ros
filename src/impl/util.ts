import logger from '../common/logger';
import * as fs from 'fs';

type RetryFunction<T> = (...args: any[]) => Promise<T>;

export async function retry<T>(fn: RetryFunction<T>, maxRetries: number, interval: number, shouldStop: (ret: T) => boolean, ...args: any[]): Promise<T> {
  let retries = 0;

  while (true) {
    try {
      const result = await fn(...args);
      if (shouldStop(result)) {
        return result;
      }
      logger.info(`Retrying in ${interval} ms...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (err) {
      logger.error(err.message);
      if (++retries > maxRetries) {
        throw new Error(`Failed after ${retries} retries: ${err.message}`);
      }
      logger.info(`Retrying in ${interval} ms...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

export function readFileAsString(filename: string): string {
  const data = fs.readFileSync(filename);
  return data.toString();
}


export function utcTimeStamp2LocalStr(timeStamp: number): string {
  let localTimeStamp = timeStamp - new Date().getTimezoneOffset() * 60 * 1000;
  const date = new Date(localTimeStamp);
  const timeStr = date.toLocaleString();
  return timeStr;
}

export function utcTimeStr2LocalStr(timeStr: string): string {
  let timeStamp = Date.parse(timeStr);
  return utcTimeStamp2LocalStr(timeStamp);
}
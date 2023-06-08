import logger from './common/logger';
import { InputProps } from './impl/interface';
import { Ros } from './impl/ros';

export default class ComponentRos {
  /**
   * @param inputs
   * @returns
   */
  public async deploy(inputs: InputProps): Promise<object> {
    logger.debug(`deploy ==> input: ${JSON.stringify(inputs.props)}`);
    const rosObj = new Ros(inputs);
    return rosObj.deploy();
  }

  public async remove(inputs: InputProps) {
    logger.debug(`remove ==> input: ${JSON.stringify(inputs.props)}`);
    const rosObj = new Ros(inputs);
    rosObj.remove();
    return {};
  }
}

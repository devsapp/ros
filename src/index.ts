import { IInputs } from '@serverless-devs/component-interface';
import { Ros } from './impl/ros';
import GLogger from './common/logger';

export default class ComponentRos {
  protected commands: any;
  constructor({ logger }: any) {
    GLogger.setLogger(logger || console);
    this.commands = {
      deploy: {
        help: {
          description: 'deploy ros stack use ros template',
          summary: 'deploy ros stack use ros template',
          option: [
            [
              '-y, --assume-yes',
              'Assume that the answer to any question which would be asked is yes',
            ],
          ],
        },
      },
      remove: {
        help: {
          description: 'remove ros stack',
          summary: 'remove ros stack',
          option: [
            [
              '-y, --assume-yes',
              'Assume that the answer to any question which would be asked is yes',
            ],
          ],
        },
      },
    };
  }

  public async deploy(inputs: IInputs): Promise<object> {
    GLogger.getLogger().debug(`deploy ==> input: ${JSON.stringify(inputs.props)}`);
    const rosObj = new Ros(inputs);
    return rosObj.deploy();
  }

  public async remove(inputs: IInputs) {
    GLogger.getLogger().debug(`remove ==> input: ${JSON.stringify(inputs.props)}`);
    const rosObj = new Ros(inputs);
    rosObj.remove();
  }
}

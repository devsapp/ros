import { IInputs } from '@serverless-devs/component-interface';
import { Ros } from './impl/ros';
import GLogger from './common/logger';
import { parseArgv } from '@serverless-devs/utils';
import inquirer from 'inquirer';

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
    GLogger.getLogger().debug(`deploy ==> input: ${JSON.stringify(inputs)}`);
    const rosObj = new Ros(inputs);
    return rosObj.deploy();
  }

  public async remove(inputs: IInputs): Promise<void> {
    GLogger.getLogger().debug(`remove ==> input: ${JSON.stringify(inputs)}`);

    //GLogger.getLogger().debug(`remove ==> assumeYes: ${JSON.stringify(inputs.args)}`);
    const command = parseArgv(inputs.args);
    //console.log(command.y);
    const rosObj = new Ros(inputs);
    if (command.y) {
      return rosObj.remove();
    }
    const stackId = await rosObj.getStackId();
    const stackName = await rosObj.getStackName();
    const meg = `Do you want to delete ros stack: ${stackName}  ${stackId}`;
    if (await this.promptForConfirmOrDetails(meg)) {
      return rosObj.remove();
    }
  }

  private async promptForConfirmOrDetails(message: string): Promise<boolean> {
    const answers: any = await inquirer.prompt([
      {
        type: 'list',
        name: 'prompt',
        message,
        choices: ['yes', 'no'],
      },
    ]);

    return answers.prompt === 'yes';
  }
}

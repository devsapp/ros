import logger from './common/logger';
import { InputProps } from './impl/interface';
import { Ros } from './impl/ros';
import inquirer from 'inquirer';
const { help, commandParse } = require('@serverless-devs/core');

export default class ComponentRos {
  /**
   * @param inputs
   * @returns
   */
  public async deploy(inputs: InputProps): Promise<object> {
    const apts = {
      boolean: ['help', 'assumeYes'],
      alias: { help: 'h', assumeYes: 'y' },
    };
    const comParse = commandParse({ args: inputs.args }, apts);
    if (comParse.data && comParse.data.help) {
      help([
        {
          header: 'Deploy',
          content: `Deploy local resources online `,
        },
        {
          header: 'Usage',
          content: `$ s ${inputs.project.projectName} deploy <options>`,
        },
        {
          header: 'Options',
          optionList: [
            {
              name: 'name',
              description: '[Optional] Stack Name',
              defaultOption: false,
              type: Boolean,
            },
          ],
        },
        {
          header: 'Global Options',
          optionList: [
            {
              name: 'debug',
              description: '[Optional] Output debug informations  ',
              type: String,
            },
            {
              name: 'help',
              description: '[Optional] Help for command',
              alias: 'h',
              type: Boolean,
            },
            {
              name: 'template',
              description: '[Optional] Specify the template file',
              alias: 't',
              type: String,
            },
            {
              name: 'access',
              description: '[Optional] Specify key alias',
              alias: 'a',
              type: String,
            },
          ],
        },
        {
          header: 'Examples with Yaml',
          content: ['$ s deploy'],
        },
      ]);
      return;
    }
    logger.debug(`deploy ==> input: ${JSON.stringify(inputs.props)}`);
    const rosObj = new Ros(inputs);
    return await rosObj.deploy();
  }

  public async info(inputs: InputProps): Promise<object> {
    logger.debug(`info ==> input: ${JSON.stringify(inputs)}`);
    const apts = {
      boolean: ['help', 'assumeYes'],
      alias: { help: 'h', assumeYes: 'y' },
    };
    const comParse = commandParse({ args: inputs.args }, apts);
    if (comParse.data && comParse.data.help) {
      help([
        {
          header: 'Info',
          content: `show online resources `,
        },
        {
          header: 'Usage',
          content: `$ s ${inputs.project.projectName} info <options>`,
        },
        {
          header: 'Options',
          optionList: [
            {
              name: 'name',
              description: '[Optional] Stack Name',
              defaultOption: false,
              type: Boolean,
            },
          ],
        },
        {
          header: 'Global Options',
          optionList: [
            {
              name: 'debug',
              description: '[Optional] Output debug informations  ',
              type: String,
            },
            {
              name: 'help',
              description: '[Optional] Help for command',
              alias: 'h',
              type: Boolean,
            },
            {
              name: 'template',
              description: '[Optional] Specify the template file',
              alias: 't',
              type: String,
            },
            {
              name: 'access',
              description: '[Optional] Specify key alias',
              alias: 'a',
              type: String,
            },
          ],
        },
        {
          header: 'Examples with Yaml',
          content: ['$ s remove'],
        },
      ]);
      return;
    }
    const rosObj = new Ros(inputs);
    return await rosObj.info();
  }

  public async remove(inputs: InputProps): Promise<any> {
    logger.debug(`remove ==> input: ${JSON.stringify(inputs.props)}`);
    const apts = {
      boolean: ['help', 'assumeYes'],
      alias: { help: 'h', assumeYes: 'y' },
    };
    const comParse = commandParse({ args: inputs.args }, apts);
    if (comParse.data && comParse.data.help) {
      help([
        {
          header: 'Remove',
          content: `Remove online resources `,
        },
        {
          header: 'Usage',
          content: `$ s ${inputs.project.projectName} remove <options>`,
        },
        {
          header: 'Options',
          optionList: [
            {
              name: 'name',
              description: '[Optional] Stack Name',
              defaultOption: false,
              type: Boolean,
            },
          ],
        },
        {
          header: 'Global Options',
          optionList: [
            {
              name: 'debug',
              description: '[Optional] Output debug informations  ',
              type: String,
            },
            {
              name: 'help',
              description: '[Optional] Help for command',
              alias: 'h',
              type: Boolean,
            },
            {
              name: 'template',
              description: '[Optional] Specify the template file',
              alias: 't',
              type: String,
            },
            {
              name: 'access',
              description: '[Optional] Specify key alias',
              alias: 'a',
              type: String,
            },
          ],
        },
        {
          header: 'Examples with Yaml',
          content: ['$ s remove', '$ s remove --name demo'],
        },
      ]);
      return;
    }
    const rosObj = new Ros(inputs);
    if (comParse.data && comParse.data.assumeYes) {
      return await rosObj.remove();
    }
    const stackId = await rosObj.getStackId();
    const stackName = await rosObj.getStackName();
    const meg = `Do you want to delete ros stack: ${stackName}  ${stackId}`;
    if (await this.promptForConfirmOrDetails(meg)) {
      return await rosObj.remove();
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

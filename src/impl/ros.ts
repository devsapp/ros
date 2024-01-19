import { IInputs } from '@serverless-devs/component-interface';
import ROS20190910, * as $ROS20190910 from '@alicloud/ros20190910';
import * as $OpenApi from '@alicloud/openapi-client';
import { readFileAsString, utcTimeStr2LocalStr } from './util';
import * as $Util from '@alicloud/tea-util';
import * as _ from 'lodash';
import GLogger from '../common/logger';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import * as yaml from 'js-yaml';
import { FC_CLIENT_CONNECT_TIMEOUT, FC_CLIENT_READ_TIMEOUT } from './const';
export class Ros {
  input: IInputs;
  rosClient: ROS20190910 | null;
  private _stackId: string;
  _startTimeStamp: number;
  _eventSet: Set<string>;
  baseDir: string;
  constructor(input: IInputs) {
    this.input = input;
    this.rosClient = null;
    this._stackId = '';
    this._startTimeStamp = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000;
    this._eventSet = new Set<string>();
    if (input.yaml?.path) {
      this.baseDir = path.dirname(input.yaml?.path);
    } else {
      this.baseDir = process.cwd();
    }
  }

  protected getRegion(): string {
    return this.input.props.region;
  }

  protected getCredential(): Promise<any> {
    return this.input.getCredential();
  }

  protected getRosEndpoint(): string {
    return this.input.props.endpoint || 'ros.aliyuncs.com';
  }

  protected getParameters(): object {
    return this.input.props.parameters || {};
  }

  public getStackName(): string {
    return this.input.props.name as string;
  }

  protected getStackPolicy(): object {
    return this.input.props.policy || {};
  }

  public async getStackId(): Promise<string> {
    const logger = GLogger.getLogger();
    if (this._stackId != '') {
      return this._stackId;
    }
    let listStacksRequest = new $ROS20190910.ListStacksRequest({
      regionId: this.getRegion(),
      stackName: [this.getStackName()],
    });
    let runtime = new $Util.RuntimeOptions({});
    try {
      const client = await this.getRosClient();
      let resp = await client.listStacksWithOptions(listStacksRequest, runtime);
      logger.debug(`listStacks ==> ${JSON.stringify(resp.body)} `);
      const totalCount = resp.body.totalCount as number;
      if (totalCount == 0) {
        return this._stackId;
      } else {
        let stacks = resp.body?.stacks;
        this._stackId = stacks[0].stackId as string;
        return this._stackId;
      }
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  protected getTemplate(): string {
    const template = this.input.props.template;
    const terraform = this.input.props.terraform;
    if (_.isEmpty(template) && _.isEmpty(terraform)) {
      return undefined;
    }
    if (!_.isEmpty(template) && !_.isEmpty(terraform)) {
      throw new Error(`You can only have one of the parameters 'template' and 'terraform'`);
    }
    // 处理 terraform 模版
    if (!_.isEmpty(terraform)) {
      const directoryPath = path.isAbsolute(terraform)
        ? terraform
        : path.join(this.baseDir, terraform);

      const files = {};
      const traverseDirectory = (directory: string) => {
        fs.readdirSync(directory).forEach((file) => {
          const filePath = path.join(directory, file);
          const stat = fs.statSync(filePath);

          if (stat.isFile()) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            files[file] = fileContent;
          } else if (stat.isDirectory()) {
            traverseDirectory(filePath);
          }
        });
      };

      traverseDirectory(directoryPath);

      const yamlData = {
        ROSTemplateFormatVersion: '2015-09-01',
        Transform: 'Aliyun::Terraform-v1.2',
        Workspace: files,
      };

      const yamlString = yaml.dump(yamlData);
      console.log(yamlString);
      return yamlString;
    }
    // 处理 ROS 模版
    if (typeof template === 'object') {
      return JSON.stringify(template);
    } else {
      //string
      const tempLowerCase = template.toLowerCase();
      if (
        tempLowerCase.startsWith('https://') ||
        tempLowerCase.startsWith('http://') ||
        tempLowerCase.startsWith('oss://')
      ) {
        return _.trim(template as string);
      } else {
        return readFileAsString(_.trim(template as string));
      }
    }
  }

  protected async getRosClient(endpoint?: string): Promise<ROS20190910> {
    if (this.rosClient !== null) {
      return this.rosClient;
    }
    const credential = await this.getCredential();
    GLogger.getLogger().debug(`getCredential ==> ${JSON.stringify(credential)}`);
    let config = new $OpenApi.Config({
      accessKeyId: credential.AccessKeyID,
      accessKeySecret: credential.AccessKeySecret,
      securityToken: credential.SecurityToken,
    });
    config.endpoint = endpoint || this.getRosEndpoint();
    config.connectTimeout = FC_CLIENT_CONNECT_TIMEOUT;
    config.readTimeout = FC_CLIENT_READ_TIMEOUT;
    this.rosClient = new ROS20190910(config);
    return this.rosClient;
  }

  protected async listStackEvents(): Promise<$ROS20190910.ListStackEventsResponseBody> {
    const logger = GLogger.getLogger();
    const stackId = await this.getStackId();
    let listStackEventsRequest = new $ROS20190910.ListStackEventsRequest({
      stackId: stackId,
      regionId: this.getRegion(),
      pageNumber: 1,
      pageSize: 10,
    });
    let runtime = new $Util.RuntimeOptions({});
    try {
      const client = await this.getRosClient();
      let resp = await client.listStackEventsWithOptions(listStackEventsRequest, runtime);
      logger.debug(`listStackEvents ===> ${JSON.stringify(resp.body)}`);
      return resp.body;
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  protected filterLatestStackEvents(
    events: $ROS20190910.ListStackEventsResponseBodyEvents[],
  ): $ROS20190910.ListStackEventsResponseBodyEvents[] {
    let filterEvents: $ROS20190910.ListStackEventsResponseBodyEvents[] = [];
    for (const e of events) {
      const eTimestamp = Date.parse(e.createTime as string);
      if (this._startTimeStamp <= eTimestamp && !this._eventSet.has(e.eventId as string)) {
        filterEvents.push(e);
        this._eventSet.add(e.eventId as string);
      }
    }
    return filterEvents;
  }

  protected async getStack(
    stackId: string,
    region?: string,
    client?: ROS20190910,
  ): Promise<$ROS20190910.GetStackResponse | null> {
    const logger = GLogger.getLogger();
    let getStackRequest = new $ROS20190910.GetStackRequest({
      stackId: stackId,
      regionId: region || this.getRegion(),
    });
    let runtime = new $Util.RuntimeOptions({});
    let clt = client || (await this.getRosClient());
    try {
      let resp = await clt.getStackWithOptions(getStackRequest, runtime);
      logger.debug(`getStack ===> ${JSON.stringify(resp.body)}`);
      return resp;
    } catch (error) {
      logger.error(error.message);
      return null;
    }
  }

  protected async waitStackChangeFinished(endMessage: string, stackId?: string) {
    const logger = GLogger.getLogger();
    const sId = stackId || (await this.getStackId());
    while (true) {
      let r = await this.listStackEvents();
      let filterEvents = this.filterLatestStackEvents(
        r.events as $ROS20190910.ListStackEventsResponseBodyEvents[],
      );
      if (filterEvents.length == 0) {
        const interval = 2000;
        logger.debug(`get latest event retrying in ${interval} ms...`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      } else {
        for (const e of filterEvents) {
          logger.info(
            `${e.resourceType}  ${e.logicalResourceId}   ${e.status}  ${
              e.statusReason
            }   ${utcTimeStr2LocalStr(e.createTime as string)} `,
          );
        }
        break;
      }
    }
    while (true) {
      let r = await this.listStackEvents();
      let filterEvents = this.filterLatestStackEvents(
        r.events as $ROS20190910.ListStackEventsResponseBodyEvents[],
      );
      for (const e of filterEvents) {
        logger.info(
          `${e.resourceType}  ${e.logicalResourceId}   ${e.status}  ${
            e.statusReason
          }   ${utcTimeStr2LocalStr(e.createTime as string)} `,
        );
      }
      const ret = await this.getStack(sId);
      if (ret != null) {
        const status = ret.body.status as string;
        if (!status.endsWith('_IN_PROGRESS')) {
          const completeStatus = [
            'CREATE_COMPLETE',
            'UPDATE_COMPLETE',
            'IMPORT_CREATE_COMPLETE',
            'IMPORT_UPDATE_COMPLETE',
            'CHECK_COMPLETE',
          ];
          logger.info(`${endMessage}; status=${status}`);
          if (!completeStatus.includes(status)) {
            throw new Error(`fail to create/update complete, status=${status}`);
          }
          break;
        }
      }
      const interval = 3000;
      logger.debug(`getStack retrying in ${interval} ms...`);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  protected async createStack(): Promise<string> {
    const logger = GLogger.getLogger();
    let parameters: $ROS20190910.CreateStackRequestParameters[] = [];
    for (const key in this.getParameters()) {
      // logger.debug(`parameters ==> ${ key }: ${ this.getParameters()[key] }`);
      parameters.push(
        new $ROS20190910.CreateStackRequestParameters({
          parameterKey: key,
          parameterValue: this.getParameters()[key],
        }),
      );
    }
    let createStackRequest = new $ROS20190910.CreateStackRequest({
      stackName: this.getStackName(),
      regionId: this.getRegion(),
      parameters: parameters,
    });
    const tempLowerCase = this.getTemplate().toLowerCase();
    if (
      tempLowerCase.startsWith('https://') ||
      tempLowerCase.startsWith('http://') ||
      tempLowerCase.startsWith('oss://')
    ) {
      createStackRequest.templateURL = this.getTemplate();
    } else {
      createStackRequest.templateBody = this.getTemplate();
    }
    const policyObj = this.getStackPolicy();
    if (_.has(policyObj, 'body')) {
      createStackRequest.stackPolicyBody = _.get(policyObj, 'body') as string;
    }
    if (_.has(policyObj, 'url')) {
      if (!createStackRequest.stackPolicyBody) {
        createStackRequest.stackPolicyURL = _.get(policyObj, 'url') as string;
      }
    }
    let runtime = new $Util.RuntimeOptions({});
    try {
      const client = await this.getRosClient();
      let resp = await client.createStackWithOptions(createStackRequest, runtime);
      logger.debug(`createStack ===> ${JSON.stringify(resp.body)} `);
      const stackId = resp.body.stackId as string;
      await this.waitStackChangeFinished(
        `stack ${this.getStackName()} create finished! stackId = ${stackId} `,
        stackId,
      );
      return stackId;
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  protected async updateStack(stackId?: string, dryRun?: boolean) {
    const logger = GLogger.getLogger();
    let parameters: $ROS20190910.UpdateStackRequestParameters[] = [];
    for (const key in this.getParameters()) {
      // logger.debug(`parameters ==> ${ key }: ${ this.getParameters()[key] } `);
      parameters.push(
        new $ROS20190910.UpdateStackRequestParameters({
          parameterKey: key,
          parameterValue: this.getParameters()[key],
        }),
      );
    }
    let updateStackRequest = new $ROS20190910.UpdateStackRequest({
      stackId: stackId || (await this.getStackId()),
      regionId: this.getRegion(),
      parameters: parameters,
      dryRun: dryRun || false,
    });
    const tempLowerCase = this.getTemplate().toLowerCase();
    if (
      tempLowerCase.startsWith('https://') ||
      tempLowerCase.startsWith('http://') ||
      tempLowerCase.startsWith('oss://')
    ) {
      updateStackRequest.templateURL = this.getTemplate();
    } else {
      updateStackRequest.templateBody = this.getTemplate();
    }
    const policyObj = this.getStackPolicy();
    if (_.has(policyObj, 'body')) {
      updateStackRequest.stackPolicyBody = _.get(policyObj, 'body') as string;
    }
    if (_.has(policyObj, 'url')) {
      if (!updateStackRequest.stackPolicyBody) {
        updateStackRequest.stackPolicyURL = _.get(policyObj, 'url') as string;
      }
    }
    let runtime = new $Util.RuntimeOptions({});
    try {
      const client = await this.getRosClient();
      await client.updateStackWithOptions(updateStackRequest, runtime);

      if (!dryRun) {
        await this.waitStackChangeFinished(
          `stack ${this.getStackName()} update finished! stackId = ${stackId} `,
          stackId,
        );
      }
    } catch (error) {
      logger.debug(JSON.stringify(error));
      logger.info(
        `you can login console to check stack, stack addr: https://ros.console.aliyun.com/${this.getRegion()}/stacks/${stackId}`,
      );
      if (error.message.includes('NotSupported: code: 400, Update the completely same stack')) {
        logger.info(chalk.yellow('Update the completely same stack is not supported'));
        return;
      }
      if (error.message.includes('ActionInProgress: code: 409')) {
        logger.info(
          chalk.yellow('Update Stack Action is already in progress, please wait for a moment ...'),
        );
        return;
      }
      logger.error(JSON.stringify(error));
      logger.warn(
        chalk.yellow(
          `You can remove the stack ${stackId} and retry deploy once; stack addr: https://ros.console.aliyun.com/${this.getRegion()}/stacks/${stackId}`,
        ),
      );
      throw error;
    }
  }

  public async deploy(): Promise<object> {
    const logger = GLogger.getLogger();
    let stackId = await this.getStackId();
    if (_.isEmpty(this.getTemplate())) {
      if (stackId == '') {
        throw new Error(
          `The stack ${this.getStackName()}  does not exist as you did not provide the 'template' parameter.`,
        );
      }
      logger.info(
        chalk.green(
          `You did not provide the 'template' parameter. Using the existing stack ${this.getStackName()} in region ${this.getRegion()}`,
        ),
      );
      return await this.info(stackId);
    }
    if (stackId == '') {
      // create
      logger.info(`create stack stackName = ${this.getStackName()}...`);
      stackId = await this.createStack();
    } else {
      // update
      logger.info(`update stack ${stackId} ${this.getStackName()} precheck ...`);
      await this.updateStack(stackId, true);
      logger.info(`update stack ${stackId} ${this.getStackName()} ...`);
      await this.updateStack(stackId, false);

      const ret = await this.getStack(stackId);
      if (ret != null) {
        if (!ret.body.status.endsWith('_COMPLETE')) {
          logger.info(`stack status = ${ret.status}, retry waitStackChangeFinished ...`);
          await this.waitStackChangeFinished(
            `stack ${this.getStackName()} update finished! stackId = ${stackId} `,
            stackId,
          );
        }
      }
    }
    return await this.info(stackId);
  }

  public async info(stackId?: string) {
    const logger = GLogger.getLogger();
    stackId = stackId || (await this.getStackId());
    if (stackId === '') {
      logger.error(`stack is not exist, id = ${stackId}, name = ${this.getStackName()}`);
      return {
        error: {
          code: 'StackNotFound',
          message: `StackNotFound: code: 404, stack is not exist, id = ${stackId}, name = ${this.getStackName()}`,
        },
      };
    }
    const ret = await this.getStack(stackId);
    if (ret == null) {
      throw new Error('get stack outputs fail');
    }

    logger.info(
      `stack detail ==> \nhttps://ros.console.aliyun.com/${this.getRegion()}/stacks/${stackId}?resourceGroupId=`,
    );

    const outputs = ret.body.outputs || [];
    logger.debug(`deploy outputs ===> ${JSON.stringify(outputs)} `);
    let exportOutputs = { stackId: stackId };
    if (!_.isEmpty(outputs)) {
      for (const o of outputs) {
        exportOutputs[o.OutputKey] = o.OutputValue;
      }
    }
    return exportOutputs;
  }

  public async remove() {
    const logger = GLogger.getLogger();
    const stackId = await this.getStackId();
    if (stackId === '') {
      logger.error(`stack is not exist, id = ${stackId}, name = ${this.getStackName()} `);
      return;
    }
    logger.debug(`remove stackId =${stackId}`);
    const output = await this.info(stackId);
    let deleteStackRequest = new $ROS20190910.DeleteStackRequest({
      stackId: stackId,
      regionId: this.getRegion(),
    });
    let runtime = new $Util.RuntimeOptions({});
    try {
      const client = await this.getRosClient();
      let resp = await client.deleteStackWithOptions(deleteStackRequest, runtime);
      logger.debug(`deleteStack ===> ${JSON.stringify(resp.body)} `);
      logger.info(
        `delete Stack: id=${stackId} name=${this.getStackName()} takes a long time, please be patient and wait...`,
      );
      while (true) {
        const ret = (await this.getStack(stackId)) as $ROS20190910.GetStackResponse;
        if (ret.body.status === 'DELETE_COMPLETE' || ret.statusCode === 404) {
          // StackNotFound
          logger.info(`stack delete finished!`);
          break;
        }
        const interval = 5000;
        logger.info(`Stack status = ${ret.body.status}, retrying in ${interval} ms...`);
        logger.debug(`getStack retrying in ${interval} ms...`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
      return output;
    } catch (error) {
      logger.error(error.message);
      if (error.message.includes('ActionInProgress: code: 409')) {
        logger.info('Delete Stack Action is already in progress, please wait for a moment ...');
        return;
      }
      throw error;
    }
  }
}

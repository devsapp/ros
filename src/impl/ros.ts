import { IInputs } from '@serverless-devs/component-interface';
import ROS20190910, * as $ROS20190910 from '@alicloud/ros20190910';
import * as $OpenApi from '@alicloud/openapi-client';
import { readFileAsString, utcTimeStr2LocalStr } from './util';
import * as $Util from '@alicloud/tea-util';
import * as _ from 'lodash';
import GLogger from '../common/logger';
export class Ros {
  input: IInputs;
  rosClient: ROS20190910 | null;
  private _stackId: string;
  _startTimeStamp: number;
  _eventSet: Set<string>;
  constructor(input: IInputs) {
    this.input = input;
    this.rosClient = null;
    this._stackId = '';
    this._startTimeStamp = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000;
    this._eventSet = new Set<string>();
  }

  protected getProps(): any {
    return this.input.props;
  }

  protected getRegion(): string {
    return this.getProps().region;
  }

  protected getCredential(): Promise<any> {
    return this.input.getCredential();
  }

  protected getRosEndpoint(): string {
    return this.getProps().endpoint || 'ros.aliyuncs.com';
  }

  protected getParameters(): object {
    return this.getProps().parameters || {};
  }

  public getStackName(): string {
    return this.getProps().name as string;
  }

  protected getStackPolicy(): object {
    return this.getProps().policy || {};
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
    const template = this.getProps().template;
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
            `${e.resourceType}  ${e.logicalResourceId}   ${e.status}  ${e.statusReason
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
          `${e.resourceType}  ${e.logicalResourceId}   ${e.status}  ${e.statusReason
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
      if (error.message.includes('NotSupported: code: 400, Update the completely same stack')) {
        logger.info('Update the completely same stack is not supported');
        return;
      }
      if (error.message.includes('ActionInProgress: code: 409')) {
        logger.info('Update Stack Action is already in progress, please wait for a moment ...');
        return;
      }
      logger.error(error.message);
      throw error;
    }
  }

  public async deploy(): Promise<object> {
    const logger = GLogger.getLogger();
    let stackId = await this.getStackId();
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
    }

    const ret = await this.getStack(stackId);
    if (ret == null) {
      throw new Error('get stack outputs fail');
    }

    logger.info(
      `stack detail ==> \nhttps://ros.console.aliyun.com/${this.getRegion()}/stacks/${stackId}?resourceGroupId=`,
    );

    const outputs = ret.body.outputs || [];
    logger.debug(`outputs ===> ${outputs} `);
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
    let deleteStackRequest = new $ROS20190910.DeleteStackRequest({
      stackId: stackId,
      regionId: this.getRegion(),
    });
    let runtime = new $Util.RuntimeOptions({});
    try {
      const client = await this.getRosClient();
      let resp = await client.deleteStackWithOptions(deleteStackRequest, runtime);
      logger.debug(`deleteStack ===> ${JSON.stringify(resp.body)} `);
      logger.info(`delete Stack: id=${stackId} name=${this.getStackName()} takes a long time, please be patient and wait...`);
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

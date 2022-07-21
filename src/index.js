const {
    getCredential,
    help,
    commandParse,
    reportComponent
} = require('@serverless-devs/core')

const Core = require('@alicloud/pop-core');
const fs = require('fs');
const {Component, Log} = require('@serverless-devs/s-core');

const log = new Log()
const defaultOpt = {
    method: 'POST',
    headers: {
        'User-Agent': 'alicloud-serverless-devs'
    }
}

class MyComponent extends Component {
    async getClient(credentials) {
        return new Core({
            accessKeyId: credentials.AccessKeyID,
            accessKeySecret: credentials.AccessKeySecret,
            endpoint: 'https://ros.aliyuncs.com',
            apiVersion: '2019-09-10',
            // 设置链接超时时间
            connectTimeout: 60000,
            // 设置读取超时时间
            readTimeout: 60000,
        })
    }

    async deploy(inputs) {

        const apts = {
            boolean: ['help', 'assumeYes'],
            alias: {help: 'h', assumeYes: 'y'},
        };
        const comParse = commandParse({args: inputs.args}, apts);
        if (comParse.data && comParse.data.help) {
            help([{
                header: 'Deploy',
                content: `Deploy local resources online `
            }, {
                header: 'Usage',
                content: `$ s ${inputs.Project.ProjectName} deploy <options>`
            }, {
                header: 'Options',
                optionList: [
                    {
                        name: 'name',
                        description: '[Optional] Stack Name',
                        defaultOption: false,
                        type: Boolean,
                    }
                ],
            }, {
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
            }, {
                header: 'Examples with Yaml',
                content: [
                    '$ s deploy',
                    '$ s deploy --name demo',
                ],
            },]);
            return;
        }

        // 获取密钥信息
        const credential = await getCredential(inputs.project.access)

        reportComponent("ros", {
            "commands": 'deploy',
            "uid": credential.AccountID,
        });

        const client = await this.getClient(credential)

        await this.init()

        const inputName = comParse.data ? comParse.data.name : undefined
        const stackName = inputName || inputs.props.name
        const region = inputs.props.region || "cn-hangzhou"

        const template = inputs.props.template || "./template.json"
        const policyObj = inputs.props.policy || {}
        const Parameters = inputs.props.parameters || {}


        // 国内做这种操作很危险，先干掉
        // if (this.state && this.state.RegionId) {
        //     if (region != this.state.RegionId || stackName != this.state.StackName) {
        //         // remove
        //         log.warn(`Delete stack ${this.state.StackName} - ${this.state.StackId}`)
        //         await new Promise((resolve, reject) => {
        //             client.request('DeleteStack', {
        //                 "RegionId": region,
        //                 "StackId": this.state.StackId,
        //             }, defaultOpt).then((result) => {
        //                 resolve(result);
        //             }, (ex) => {
        //                 reject(ex)
        //             })
        //         })
        //         log.warn(`Deleted stack ${this.state.StackName} - ${this.state.StackId}`)
        //     }
        // }

        log.log("Start deploy ... ")
        log.log("Check stack ... ")
        const response = await new Promise((resolve, reject) => {
            client.request('ListStacks', {
                "RegionId": region,
                "StackName.1": stackName
            }, defaultOpt).then((result) => {
                resolve(result);
            }, (ex) => {
                reject(ex)
            })
        })

        log.log("Get template body ... ")

        let StackPolicyURL
        let StackPolicyBody
        if (policyObj.url) {
            StackPolicyURL = policyObj.url
        }
        if (policyObj.body) {
            StackPolicyBody = policyObj.body
        }
        const requestBody = {
            "RegionId": region,
        }
        const tempLowerCase = template.toLowerCase()
        if (tempLowerCase.startsWith("https://") || tempLowerCase.startsWith("http://") || tempLowerCase.startsWith("oss://")) {
            requestBody["TemplateURL"] = template
        } else {
            const templateBody = fs.readFileSync(template, 'utf-8');
            requestBody["TemplateBody"] = templateBody
        }


        let indexTemp = 1
        for (const key in Parameters) {
            requestBody[`Parameters.${indexTemp}.ParameterKey`] = key
            requestBody[`Parameters.${indexTemp}.ParameterValue`] = Parameters[key]
            indexTemp = indexTemp + 1
        }

        if (StackPolicyBody) {
            requestBody.StackPolicyBody = StackPolicyBody
        }
        if (!requestBody.StackPolicyBody && StackPolicyURL) {
            requestBody.StackPolicyURL = StackPolicyURL
        }

        const result = {
            "RegionId": region,
            "StackName": stackName
        }

        if (response.Stacks.length == 0) {
            // 创建逻辑
            log.log("Create stack ... ")
            requestBody.StackName = stackName
            const createResponse = await new Promise((resolve, reject) => {
                client.request('CreateStack', requestBody, defaultOpt).then((result) => {
                    resolve(result);
                }, (ex) => {
                    reject(ex)
                })
            })
            log.log(`Created stack: ${createResponse.StackId}`)
            result.StackId = createResponse.StackId
        } else {
            // 更新逻辑
            log.log("Update stack ... ")
            requestBody.StackId = response.Stacks[0].StackId
            result.StackId = response.Stacks[0].StackId
            const updateResponse = await new Promise((resolve, reject) => {
                client.request('UpdateStack', requestBody, defaultOpt).then((result) => {
                    resolve(result);
                }, (ex) => {
                    reject(ex)
                })
            })
            log.log(`Updated stack: ${requestBody.StackId}`)
        }

        this.state = result
        await this.save()
        inputs.props = {
            report_content: {
                ros: [
                    {
                        stack: result.StackId
                    }
                ]
            }
        }
        return result
    }

    async remove(inputs) {

        const apts = {
            boolean: ['help', 'assumeYes'],
            alias: {help: 'h', assumeYes: 'y'},
        };
        const comParse = commandParse({args: inputs.args}, apts);
        if (comParse.data && comParse.data.help) {
            help([{
                header: 'Remove',
                content: `Remove online resources `
            }, {
                header: 'Usage',
                content: `$ s ${inputs.Project.ProjectName} deploy <options>`
            }, {
                header: 'Options',
                optionList: [
                    {
                        name: 'name',
                        description: '[Optional] Stack Name',
                        defaultOption: false,
                        type: Boolean,
                    }
                ],
            }, {
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
            }, {
                header: 'Examples with Yaml',
                content: [
                    '$ s remove',
                    '$ s remove --name demo',
                ],
            },]);
            return;
        }

        // 获取密钥信息
        const credential = await getCredential(inputs.project.access)

        reportComponent("ros", {
            "commands": 'remove',
            "uid": credential.AccountID,
        });

        const client = await this.getClient(credential)

        await this.init()

        const inputName = comParse.data ? comParse.data.name : undefined
        const stackName = inputName || inputs.props.name
        const region = inputs.props.region || "cn-hangzhou"

        log.log("Start remove ... ")
        log.log("Check stack ... ")
        const response = await new Promise((resolve, reject) => {
            client.request('ListStacks', {
                "RegionId": region,
                "StackName.1": stackName
            }, defaultOpt).then((result) => {
                resolve(result);
            }, (ex) => {
                throw new Error(ex)
            })
        })
        if (response.Stacks.length == 0) {
            log.error(`Could not found this stack: ${stackName}`)
            return {}
        }

        log.log("Remove stack ... ")
        await new Promise((resolve, reject) => {
            client.request('DeleteStack', {
                "RegionId": region,
                "StackId": response.Stacks[0].StackId
            }, defaultOpt).then((result) => {
                resolve(result);
            }, (ex) => {
                reject(ex)
            })
        })
        log.log(`Removed stack: ${response.Stacks[0].StackId}`)

        this.state = {}
        await this.save()

        inputs.props = {
            report_content: {
                ros: []
            }
        }

        return {}
    }
}

module.exports = MyComponent;

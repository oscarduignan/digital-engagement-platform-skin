import CommonChatController from './CommonChatController'

export default class ProactiveChatController {
    commonChatController: CommonChatController;
    constructor() {
        this.commonChatController = new CommonChatController();
    }

    launchProactiveChat(obj: {state: string}): void {
        let proactiveObj: {state: string, type: string} = {
            state: obj.state,
            type: 'proactive'
        }
        console.log('PROACTIVEOBJ', obj)
        this.commonChatController._launchChat(proactiveObj);
    }
}
// Cannot say with 100% certainty but using the console and reviewing the code it looks like state is either 'show' or 'missed'. Type in the console is coming back as proactive which is the same as the object above.
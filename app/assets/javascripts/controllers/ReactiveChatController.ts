import ClickToChatButtons from '../utils/ClickToChatButtons'
import ClickToChatButton from '../utils/ClickToChatButton'
import CommonChatController from './CommonChatController'
import * as DisplayState from '../NuanceDisplayState'
import { messages} from '../utils/Messages'
import { ClickToChatObjectInterface } from '../utils/ClickToChatButtons'

interface c2cDisplayStateMessagesInterface {
    [DisplayState.OutOfHours]: string
    [DisplayState.Ready]: string
    [DisplayState.Busy]: string
    [DisplayState.ChatActive]: string
}

const c2cDisplayStateMessages: c2cDisplayStateMessagesInterface = {
    [DisplayState.OutOfHours]: messages.outofhours,
    [DisplayState.Ready]: messages.ready,
    [DisplayState.Busy]: messages.busy,
    [DisplayState.ChatActive]: messages.active
};

export default class ReactiveChatController {
    sdk: any
    c2cButtons: ClickToChatButtons
    commonChatController: CommonChatController
    constructor() {
        this.sdk = null;
        this.c2cButtons = new ClickToChatButtons(this._clickToChatCallback(), c2cDisplayStateMessages);
        this.commonChatController = new CommonChatController();
    }

    _clickToChatCallback(): (c2cIdx: any) => void {
        return (c2cIdx: any) => this._onC2CButtonClicked(c2cIdx)
    }
    // This appears to be a function which returns a function which returns void. Do you agree?

    addC2CButton(c2cObj: ClickToChatObjectInterface, divID: string, buttonClass: string): void {
        if (c2cObj.displayState == "ready") {
            this.c2cButtons.addButton(
                c2cObj,
                new ClickToChatButton(document.getElementById(divID), buttonClass),
                divID
            );
        }
    }

    _onC2CButtonClicked(c2cIdx: any): void {
        const reactiveObj: {type: string} = {
            type: 'reactive'
        }
        this.sdk = window.Inq.SDK;
        this.sdk.onC2CClicked(c2cIdx, () => {
            this.commonChatController._launchChat(reactiveObj);
        });
    }
}

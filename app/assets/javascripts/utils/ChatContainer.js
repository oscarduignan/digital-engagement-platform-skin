import Transcript from '../services/Transcript';
import EndChatPopup from '../views/EndChatPopup';
import { sanitiseAndParseJsonData } from './JsonUtils';

const nullEventHandler = {
    onSend: function () {},
    onCloseChat: function () {},
    onHideChat: function () {},
    onRestoreChat: function () {},
    onConfirmEndChat: function () {},
    onSoundToggle: function () {},
    onStartTyping: function () {},
    onStopTyping: function () {},
    onSkipToTopLink: function () {},
    onPrint: function () {}
};

export default class ChatContainer {
    constructor(messageClasses, containerHtml, SDK) {
        this.container = document.createElement("div");
        this.container.id = "ciapiSkin";
        this.eventHandler = nullEventHandler;
        this.closeMethod = null;

        this.stopTypingTimeoutId = undefined;
        this.isCustomerTyping = false;
        this.typingEventThresholdMillis = 3000;

        this.SDK = SDK;

        this.container.insertAdjacentHTML("beforeend", containerHtml);
        this.content = this.container.querySelector("#ciapiSkinChatTranscript");
        this.custInput = this.container.querySelector("#custMsg");
        this.soundButton = this.container.querySelector(".sound-button");
        this._registerEventListeners();
        this.transcript = new Transcript(this.content, messageClasses);
        this.endChatPopup = new EndChatPopup(this.container.querySelector("#ciapiSkinContainer"), this);
    }

    

    _resetStopTypingTimeout() {
        if (this.stopTypingTimeoutId != undefined) {
            clearTimeout(this.stopTypingTimeoutId);
        }

        this.stopTypingTimeoutId =
            setTimeout(this.stopTyping.bind(this), this.typingEventThresholdMillis, this.eventHandler);
    }

    stopTyping(eventHandler) {
        this.isCustomerTyping = false;
        eventHandler.onStopTyping();
    }

    startTyping(eventHandler) {
        this.isCustomerTyping = true;
        eventHandler.onStartTyping();
    }

    element() {
        return this.container;
    }

    contentElement() {
        return this.content;
    }

    currentInputText() {
        return this.custInput.value;
    }

    clearCurrentInputText() {
        this.custInput.value = "";
    }

    getTranscript() {
        return this.transcript;
    }

    destroy() {
        this.container.parentElement.removeChild(this.container);
    }

    minimise() {
        this.container.classList.add("minimised");
        try {
            document.getElementById("ciapiSkinRestoreButton").setAttribute("tabindex", 0);
        } catch {
            console.log('DEBUG: ' + 'Elements not found' )
        }
    }

    restore() {
        this.container.classList.remove("minimised");
    }

    processExternalAndResponsiveLinks(e) {
        const linkEl = e.target;
        const linkHref = linkEl.getAttribute("href");

        if(!linkHref) return null; // stop clicks on the container from triggering the following code

        const nuanceMessageData = linkEl.dataset.nuanceMessageData;
        const nuanceMessageText = linkEl.dataset.nuanceMessageText;
        const nuanceDatapass = linkEl.dataset.nuanceDatapass;

        // Prevent defaults
        if (linkHref == "#" || linkHref == "") e.preventDefault();

        // Handle Responsive Links
        if (!!nuanceMessageData) {
            const messageText = nuanceMessageText ? nuanceMessageText : linkEl.text;
            const messageData = sanitiseAndParseJsonData(nuanceMessageData);
            if (messageData) {
                this.SDK.sendRichContentMessage(messageText, messageData);
            }
        } else if (!!nuanceMessageText) {
            this.SDK.sendMessage(nuanceMessageText);
        }

        // Handle External Links
        if (linkHref != "#" && linkHref != "") {
            var ndepVaEventData = JSON.stringify({
                data: {
                    address: linkHref,
                },
                event: "linkClicked",
            });
            this.SDK.sendDataPass({ ndepVaEvent: ndepVaEventData });
        }

        // Handle Datapass
        if (!!nuanceDatapass) {
            const datapass = sanitiseAndParseJsonData(e.target.dataset.nuanceDatapass);
            if (datapass){
                this.SDK.sendDataPass(datapass);
            }    
        }

        this.disablePreviousWidgets();
    }

    processTranscriptEvent(e) {
        this.processExternalAndResponsiveLinks(e);

        if (
           e.target && e.target.tagName && e.target.tagName.toLowerCase() === "a" &&
            !!e.target.dataset &&
            !!e.target.dataset.vtzJump
        ) {
            this.SDK.sendVALinkMessage(e, null, null, null);
            if (e.target.className != "dialog") {
                this._focusOnNextAutomatonMessage();
            } else {
                this.closeMethod = "Link";
            }
        }
    }

    processKeypressEvent(e) {
        this._resetStopTypingTimeout();

        if(!this.isCustomerTyping) {
            this.startTyping(this.eventHandler); 
        }

        const enterKey = 13;
        if (e.which == enterKey) {
            this.eventHandler.onSend();
            e.preventDefault();
        }
    }

    disablePreviousWidgets() {
        // Disable quick-reply widgets
        let qrWidgets = document.querySelectorAll(".quick-reply-widget");
        !!qrWidgets && qrWidgets.forEach(widget => widget.disable());
      }

    setEventHandler(eventHandler) {
        this.eventHandler = eventHandler;
    }

    _processCloseButtonEvent(e) {
        this.closeMethod = "Button";
        
        let endChatNonFocusable = this.container.querySelectorAll('a[href], input, textarea, button:not([id="cancelEndChat"]):not([id="confirmEndChat"]');

        endChatNonFocusable.forEach(function (element) {
            element.tabIndex = -1;
        });

        const skinChatTranscript = this.container.querySelector("#ciapiSkinChatTranscript");

        skinChatTranscript.setAttribute("tabindex", -1);

        this.eventHandler.onCloseChat();
    }

    _registerKeypressEventListener(selector, handler) {
        const element = this.container.querySelector(selector);
        if (element) {
            element.addEventListener("keypress", handler);
        }
    }

    _registerEventListener(selector, handler) {
        const element = this.container.querySelector(selector);
        if (element) {
            element.addEventListener("click", handler);
        }
    }

    _registerEventListeners() {

        this._registerKeypressEventListener("#custMsg", (e) => {
            this.processKeypressEvent(e)
        });

        this._registerEventListener("#ciapiSkinSendButton", (e) => {
            this.eventHandler.onSend();
        });

        this._registerEventListener("#ciapiSkinCloseButton", (e) => {
            this._processCloseButtonEvent(e)
        });

        this._registerEventListener("#ciapiSkinHideButton", (e) => {
            this.eventHandler.onHideChat();
        });

        this._registerEventListener("#skipToBottomLink", (e) => {
            this.eventHandler.onSkipToTopLink(e);
        });

        this._registerEventListener("#ciapiSkinRestoreButton", (e) => {
            this.eventHandler.onRestoreChat();
        });

        this._registerEventListener("#ciapiSkinChatTranscript", (e) => {
            this.processTranscriptEvent(e);
        });

        this._registerEventListener("#printButton", (e) => {
            this.eventHandler.onPrint(e);
            e.preventDefault();
        });

        this._registerEventListener("#toggleSound", (e) => {
            this.eventHandler.onSoundToggle();
            e.preventDefault();
        });
    }

    confirmEndChat() {
        this.endChatPopup.show();
        document.getElementById("endChatPopup").focus();
    }

    onCancelEndChat(e, toPrint) {
            const ciapiSkinContainer = document.querySelector("#ciapiSkin");
            const endChatNonFocusable = ciapiSkinContainer.querySelectorAll('a[href], input, textarea, button');
            endChatNonFocusable.forEach(function (element) {
                element.removeAttribute("tabindex");
            });

            document.getElementById("ciapiSkinChatTranscript").setAttribute("tabindex", 0);
            this.endChatPopup.hide();

            const endChatGiveFeedback = Array.from(
                document.querySelectorAll('.dialog')
            ).pop();

            if (this.closeMethod === "Button") {
                document.getElementById("ciapiSkinCloseButton").focus();
            } else {
                endChatGiveFeedback.focus();
            }
            if(toPrint){
                this.eventHandler.onPrint(e);
            }
        
    }

    _removeSkinHeadingElements() {
        if (document.contains(document.getElementById("print")) && document.contains(document.getElementById("sound"))) {
            document.getElementById("print").remove();
            document.getElementById("sound").remove();

            try {
                document.getElementById("ciapiSkinHideButton").setAttribute("tabindex", 0);
                document.getElementById("ciapiSkinCloseButton").setAttribute("tabindex", 0);
                document.getElementById("accessibility-statement-link").setAttribute("tabindex", 0);
            } catch {
                console.log('DEBUG: ' + 'Elements not found' )
            }

            let transcriptHeading = document.getElementById("ciapiSkinHeader");

            transcriptHeading.style.height = "auto";
            transcriptHeading.style.width = "auto";
        }
    }

    _focusOnNextAutomatonMessage() {
        setTimeout(function(e) {
            var lastAgentMessage = Array.from(
                document.querySelectorAll('.ciapi-agent-message')
              ).pop();
    
            lastAgentMessage.focus();
        }, 1000);
    }

    onConfirmEndChat() {
        this.endChatPopup.hide();
        this.eventHandler.onConfirmEndChat();
        document.getElementById("legend_give_feedback").focus();
        this._removeSkinHeadingElements();
    }

    showPage(page) {
        this.container.querySelector("#ciapiSkinChatTranscript").style.display = "none";
        this.container.querySelector("#ciapiSkinFooter").style.display = "none";
        page.attachTo(this.container.querySelector("#ciapiChatComponents"));
    }
}


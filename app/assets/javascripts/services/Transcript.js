export default class Transcript {
    constructor(content, vaLinkCallback, classes) {
        this.content = content;
        this.vaLinkCallback = vaLinkCallback;
        this.classes = classes
    }

    addAgentMsg(msg, agent) {
        this._appendMessage(msg, this.classes.Agent);
    }

    addCustomerMsg(msg, agent) {
        this._appendMessage(msg, this.classes.Customer);
    }

    addSystemMsg(msg) {
        this._appendMessage(msg, this.classes.System);
    }

    addOpenerScript(msg) {
        this._appendMessage(msg, this.classes.Opener);
    }

    addSkipToBottomLink() {

        const chatContainer = document.getElementById("ciapiSkinChatTranscript")

        if (chatContainer.scrollHeight > chatContainer.clientHeight) {
            this.createSkipLink("skipToTopWithScroll");
        }
        else {
            this.createSkipLink("skipToTopWithOutScroll");
        }

    }

    createSkipLink(className) {

        const chatContainer = document.getElementById("ciapiSkinChatTranscript")

        chatContainer.insertAdjacentHTML("beforeend", '<div id="skipToTop" class="' + className + ' govuk-!-padding-top-2"><a id="skipToTopLink" href="#" class="govuk-skip-link">Skip to top of conversation</a></div>');
        document.getElementById("skipToTopLink").addEventListener("click",
            function (e) {
                e.preventDefault();
                document.getElementById("skipToBottomLink").focus();
            })

    }

    appendMessgeInLiveRegion(msg, id){
      document.getElementById(id).innerHTML = msg;
      document.getElementById(id).style = "display:block;"
    }

    addAutomatonMsg(msg) {

        var id = "liveAutomatedMsgId" + ( Math.random() * 100);
        const msgDiv = "<div id="+ id +" aria-live='polite' style=display:none; class= "+ this.classes.Agent.Inner + "></div>";

        const skipToTop = document.getElementById("skipToTop");
        const chatContainer = document.getElementById("ciapiSkinChatTranscript")

        let agentDiv = document.createElement("div")
        agentDiv.classList.add(this.classes.Agent.Outer);
        agentDiv.insertAdjacentHTML("beforeend", msgDiv);

        this._fixUpVALinks(agentDiv);

        this.content.appendChild(agentDiv);

        setTimeout(this.appendMessgeInLiveRegion, 250, msg, id)


        if (chatContainer) {

            if (skipToTop != null) {
                chatContainer.removeChild(skipToTop)
            }

            this.addSkipToBottomLink();

        }
        this._showLatestContent(this.classes.Agent);
    }

    _fixUpVALinks(div) {
        const links = div.getElementsByTagName('a');

        for (const link of links) {
            for (const attribute of link.attributes) {
                if (attribute.name === "data-vtz-link-type" && attribute.value === "Dialog") {
                    link.onclick = this.vaLinkCallback;
                }
            }
        }
    }

    _appendMessage(msg, msg_class) {

        var id = "liveMsgId" + ( Math.random() * 100);

        const msgDiv = "<div class=" + msg_class.Outer + "><div id=" + id + " aria-live='polite' style=display:none; class= " + msg_class.Inner + "></div></div>";

        const skipToTop = document.getElementById("skipToTop");
        const chatContainer = document.getElementById("ciapiSkinChatTranscript")

        this.content.insertAdjacentHTML("beforeend", msgDiv);

        setTimeout(this.appendMessgeInLiveRegion, 250, msg, id)

        if (chatContainer) {

            if (skipToTop != null) {
                chatContainer.removeChild(skipToTop)
            }

            this.addSkipToBottomLink();

        }

        this._showLatestContent(msg_class);
    }




    _showLatestContent(msg_class) {
        const agentInner = msg_class.Inner;
        const innerClassArray = document.getElementsByClassName(agentInner);
        const outerAgent = msg_class.Outer;
        const outerClassArray = document.getElementsByClassName(outerAgent);

        if (innerClassArray.length > 0 && outerClassArray.length > 0) {
            const lengthOfAgentInnerArray = innerClassArray.length - 1;
            const heightOfLastMessage = innerClassArray[lengthOfAgentInnerArray].clientHeight;
            const outerAgentParentId = outerClassArray[0].parentElement;
            const heightOfSkinChat = outerAgentParentId.clientHeight;

            if (typeof heightOfLastMessage !== 'undefined' && typeof heightOfSkinChat !== 'undefined') {
                if (heightOfLastMessage > heightOfSkinChat) {
                    innerClassArray[lengthOfAgentInnerArray].scrollIntoView({ block: 'nearest' });
                } else {
                    this.content.scrollTo(0, this.content.scrollHeight);
                }
            } else {
                this.content.scrollTo(0, this.content.scrollHeight);
            }
        } else {
            this.content.scrollTo(0, this.content.scrollHeight);
        }
    }
}

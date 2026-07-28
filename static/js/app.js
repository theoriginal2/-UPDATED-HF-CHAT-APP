/*
==========================================================
 HF CHAT FRONTEND ENGINE
 Version: 2.0

 Compatible with:
 - templates/index.html
 - static/css/style.css
 - Flask /chat endpoint

==========================================================
*/


"use strict";


/* ==========================================================
   CONFIGURATION
========================================================== */


const CONFIG = window.HF_CHAT_CONFIG || {

    appName: "HF Chat",

    apiEndpoint: "/chat",

    model: "Qwen/Qwen2.5-7B-Instruct",

    rememberConversation: true,

    enableMarkdown: true,

    enableSyntaxHighlighting: true

};



/* ==========================================================
   DOM ELEMENTS
========================================================== */


const chatArea =
    document.getElementById("chatArea");


const welcomeScreen =
    document.getElementById("welcomeScreen");


const messageInput =
    document.getElementById("messageInput");


const sendBtn =
    document.getElementById("sendBtn");


const typingIndicator =
    document.getElementById("typingIndicator");


const messageTemplate =
    document.getElementById("messageTemplate");


const newChatBtn =
    document.getElementById("newChatBtn");


const clearBtn =
    document.getElementById("clearBtn");


const themeBtn =
    document.getElementById("themeBtn");


const scrollBottomBtn =
    document.getElementById("scrollBottomBtn");


const settingsBtn =
    document.getElementById("settingsBtn");


const exportBtn =
    document.getElementById("exportBtn");


const voiceBtn =
    document.getElementById("voiceBtn");


const sidebar =
    document.querySelector(".sidebar");



/* ==========================================================
   APPLICATION STATE
========================================================== */


let conversation = [];


let isGenerating = false;


const STORAGE_KEY =
    "hf_chat_history";


const THEME_KEY =
    "hf_chat_theme";



/* ==========================================================
   INITIAL START
========================================================== */


document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);



function initializeApp(){

    loadTheme();

    loadConversation();

    setupEvents();

    autoResize();

    scrollToBottom();

    console.log(
        `${CONFIG.appName} initialized`
    );

}

/* ==========================================================
   EVENT SYSTEM
========================================================== */


function setupEvents(){


    sendBtn.addEventListener(
        "click",
        sendMessage
    );


    messageInput.addEventListener(
        "keydown",
        handleInputKeydown
    );


    messageInput.addEventListener(
        "input",
        autoResize
    );


    newChatBtn.addEventListener(
        "click",
        startNewChat
    );


    clearBtn.addEventListener(
        "click",
        clearConversation
    );


    themeBtn.addEventListener(
        "click",
        toggleTheme
    );


    scrollBottomBtn.addEventListener(
        "click",
        scrollToBottom
    );


    chatArea.addEventListener(
        "scroll",
        handleScroll
    );


    exportBtn.addEventListener(
        "click",
        openExportModal
    );


    settingsBtn.addEventListener(
        "click",
        openSettingsModal
    );


}



/* ==========================================================
   INPUT HANDLING
========================================================== */


function handleInputKeydown(event){


    if(event.key === "Enter" && !event.shiftKey){

        event.preventDefault();

        sendMessage();

    }


}



/* ==========================================================
   SEND MESSAGE
========================================================== */


async function sendMessage(){


    const text =
        messageInput.value.trim();



    if(!text || isGenerating){

        return;

    }



    addMessage(
        "user",
        text
    );


    conversation.push({

        role:"user",

        content:text

    });



    saveConversation();


    messageInput.value = "";


    autoResize();


    hideWelcome();


    showTyping();



    isGenerating = true;


    toggleSendButton();



    try{


        const response =
            await fetch(
                CONFIG.apiEndpoint,
                {

                    method:"POST",

                    headers:{

                        "Content-Type":
                            "application/json"

                    },

                    body:JSON.stringify({

                        message:text

                    })

                }

            );



        const data =
            await response.json();



        hideTyping();



        if(!data.success){


            throw new Error(

                data.error ||
                "AI response failed"

            );


        }



        addMessage(
            "assistant",
            data.reply
        );



        conversation.push({

            role:"assistant",

            content:data.reply

        });



        saveConversation();



    }

    catch(error){


        hideTyping();



        addMessage(

            "assistant",

            `⚠️ Error: ${error.message}`

        );



        console.error(

            "Chat error:",

            error

        );


    }

    finally{


        isGenerating = false;


        toggleSendButton();


    }


}



/* ==========================================================
   SEND BUTTON STATE
========================================================== */


function toggleSendButton(){


    sendBtn.disabled =
        isGenerating;


}



/* ==========================================================
   TYPING INDICATOR
========================================================== */


function showTyping(){


    typingIndicator.classList.remove(
        "hidden"
    );


    scrollToBottom();


}



function hideTyping(){


    typingIndicator.classList.add(
        "hidden"
    );


}



/* ==========================================================
   WELCOME SCREEN
========================================================== */


function hideWelcome(){


    if(welcomeScreen){

        welcomeScreen.style.display =
            "none";

    }


}



function showWelcome(){


    if(welcomeScreen){

        welcomeScreen.style.display =
            "flex";

    }


}

/* ==========================================================
   MESSAGE RENDERING ENGINE
========================================================== */


function addMessage(role, content){


    if(!messageTemplate){

        console.error(
            "Message template missing"
        );

        return;

    }



    const clone =
        messageTemplate.content.cloneNode(true);



    const message =
        clone.querySelector(".message");



    const avatar =
        clone.querySelector(".avatar");



    const sender =
        clone.querySelector(".sender");



    const timestamp =
        clone.querySelector(".timestamp");



    const body =
        clone.querySelector(".message-body");



    const toolbar =
        clone.querySelector(".message-toolbar");



    if(role === "user"){


        message.classList.add(
            "user"
        );


        avatar.textContent =
            "👤";


        sender.textContent =
            "You";


    }

    else{


        message.classList.add(
            "assistant"
        );


        avatar.textContent =
            "🤖";


        sender.textContent =
            "HF Chat";


    }



    timestamp.textContent =
        getTime();



    body.innerHTML =
        renderMarkdown(content);



    setupMessageActions(
        toolbar,
        content
    );



    chatArea.appendChild(
        clone
    );



    highlightCode();


    scrollToBottom();


}



/* ==========================================================
   MARKDOWN PROCESSING
========================================================== */


function renderMarkdown(text){


    if(!CONFIG.enableMarkdown ||
       !window.marked){


        return escapeHTML(text);


    }



    marked.setOptions({

        breaks:true,

        gfm:true

    });



    return marked.parse(
        text
    );


}



/* ==========================================================
   HTML SECURITY
========================================================== */


function escapeHTML(text){


    return text

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );


}



/* ==========================================================
   CODE HIGHLIGHTING
========================================================== */


function highlightCode(){


    if(

        !CONFIG.enableSyntaxHighlighting ||

        !window.hljs

    ){

        return;

    }



    document
        .querySelectorAll(
            "pre code"
        )
        .forEach(block=>{


            hljs.highlightElement(
                block
            );


            addCopyCodeButton(
                block.parentElement
            );


        });


}



/* ==========================================================
   COPY CODE BUTTON
========================================================== */


function addCopyCodeButton(pre){


    if(
        pre.querySelector(".copy-code")
    ){

        return;

    }



    const button =
        document.createElement(
            "button"
        );


    button.className =
        "copy-code";


    button.innerHTML =
        '<i class="ri-file-copy-line"></i> Copy';



    button.addEventListener(
        "click",
        ()=>{


            const code =
                pre.querySelector(
                    "code"
                )
                .innerText;



            navigator.clipboard
                .writeText(code)
                .then(()=>{


                    showToast(
                        "Code copied",
                        "success"
                    );


                });


        }

    );



    pre.style.position =
        "relative";



    pre.appendChild(
        button
    );


}



/* ==========================================================
   MESSAGE ACTIONS
========================================================== */


function setupMessageActions(
    toolbar,
    content
){


    const copyBtn =
        toolbar.querySelector(
            ".copy-btn"
        );



    if(copyBtn){


        copyBtn.addEventListener(
            "click",
            ()=>{


                navigator.clipboard
                    .writeText(content);



                showToast(
                    "Message copied",
                    "success"
                );


            }

        );


    }



}



/* ==========================================================
   TIME FORMAT
========================================================== */


function getTime(){


    return new Date()

        .toLocaleTimeString(

            [],

            {

                hour:"2-digit",

                minute:"2-digit"

            }

        );


}

/* ==========================================================
   CONVERSATION STORAGE
========================================================== */


function saveConversation(){

    if(!CONFIG.rememberConversation){

        return;

    }


    try{

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(conversation)

        );


    }

    catch(error){

        console.error(

            "Could not save conversation:",

            error

        );

    }

}



/* ==========================================================
   LOAD CONVERSATION
========================================================== */


function loadConversation(){


    if(!CONFIG.rememberConversation){

        return;

    }



    const saved =

        localStorage.getItem(
            STORAGE_KEY
        );



    if(!saved){

        return;

    }



    try{


        conversation =
            JSON.parse(saved);



        if(
            !Array.isArray(conversation) ||
            conversation.length === 0
        ){

            conversation = [];

            return;

        }



        hideWelcome();



        conversation.forEach(message=>{


            addMessage(

                message.role,

                message.content

            );


        });



    }

    catch(error){


        console.error(

            "Failed loading history:",

            error

        );


        conversation = [];


    }


}



/* ==========================================================
   NEW CHAT
========================================================== */


function startNewChat(){


    const confirmed =

        confirm(
            "Start a new conversation?"
        );



    if(!confirmed){

        return;

    }



    conversation = [];



    localStorage.removeItem(

        STORAGE_KEY

    );



    chatArea.innerHTML = "";



    showWelcome();



    showToast(

        "New chat started",

        "success"

    );


}



/* ==========================================================
   CLEAR CONVERSATION
========================================================== */


function clearConversation(){


    const confirmed =

        confirm(
            "Delete all chat history?"
        );



    if(!confirmed){

        return;

    }



    conversation = [];



    localStorage.removeItem(

        STORAGE_KEY

    );



    chatArea.innerHTML = "";



    showWelcome();



    showToast(

        "Conversation cleared",

        "success"

    );


}



/* ==========================================================
   THEME MANAGEMENT
========================================================== */


function loadTheme(){


    const savedTheme =

        localStorage.getItem(

            THEME_KEY

        ) || "dark";



    applyTheme(
        savedTheme
    );


}



function toggleTheme(){


    const current =

        document.body.classList.contains(
            "light"
        )

        ? "light"

        : "dark";



    const next =

        current === "dark"

        ? "light"

        : "dark";



    applyTheme(
        next
    );


}



function applyTheme(theme){


    if(theme === "light"){


        document.body.classList.add(
            "light"
        );


        themeBtn.innerHTML =

            '<i class="ri-sun-line"></i>';


    }

    else{


        document.body.classList.remove(
            "light"
        );


        themeBtn.innerHTML =

            '<i class="ri-moon-line"></i>';


    }



    localStorage.setItem(

        THEME_KEY,

        theme

    );


}



/* ==========================================================
   SCROLL MANAGEMENT
========================================================== */


function scrollToBottom(){


    if(!chatArea){

        return;

    }



    chatArea.scrollTo({

        top:
            chatArea.scrollHeight,

        behavior:
            "smooth"

    });


}



function handleScroll(){


    const distance =

        chatArea.scrollHeight -

        chatArea.scrollTop -

        chatArea.clientHeight;



    if(distance > 300){


        scrollBottomBtn.classList.remove(
            "hidden"
        );


    }

    else{


        scrollBottomBtn.classList.add(
            "hidden"
        );


    }


}

/* ==========================================================
   TOAST SYSTEM
========================================================== */


function showToast(message, type = "success"){


    const container =

        document.getElementById(
            "toastContainer"
        );



    if(!container){

        return;

    }



    const toast =

        document.createElement(
            "div"
        );



    toast.className =

        `toast ${type}`;



    toast.textContent =
        message;



    container.appendChild(
        toast
    );



    setTimeout(()=>{


        toast.style.opacity = "0";


        toast.style.transform =
            "translateY(-10px)";



        setTimeout(()=>{


            toast.remove();


        },250);



    },2500);


}



/* ==========================================================
   EXPORT MODAL
========================================================== */


function openExportModal(){


    const modal =

        document.getElementById(
            "exportModal"
        );



    if(modal){

        modal.classList.remove(
            "hidden"
        );

    }


}



function closeExportModal(){


    const modal =

        document.getElementById(
            "exportModal"
        );



    if(modal){

        modal.classList.add(
            "hidden"
        );

    }


}



/* ==========================================================
   SETTINGS MODAL
========================================================== */


function openSettingsModal(){


    const modal =

        document.getElementById(
            "settingsModal"
        );



    if(modal){

        modal.classList.remove(
            "hidden"
        );

    }


}



function closeSettingsModal(){


    const modal =

        document.getElementById(
            "settingsModal"
        );



    if(modal){

        modal.classList.add(
            "hidden"
        );

    }


}



/* ==========================================================
   EXPORT FUNCTIONS
========================================================== */


function exportTXT(){


    let output = "";



    conversation.forEach(message=>{


        output +=

`${message.role.toUpperCase()}

${message.content}


----------------------------


`;


    });



    downloadFile(

        "hf-chat-conversation.txt",

        output

    );



}



function exportMarkdown(){


    let output = "";



    conversation.forEach(message=>{


        output +=

`## ${message.role}


${message.content}


`;


    });



    downloadFile(

        "hf-chat-conversation.md",

        output

    );


}



function exportJSON(){


    downloadFile(

        "hf-chat-conversation.json",

        JSON.stringify(

            conversation,

            null,

            2

        )

    );


}



/* ==========================================================
   FILE DOWNLOADER
========================================================== */


function downloadFile(
    filename,
    content
){


    const blob =

        new Blob(

            [content],

            {

                type:
                "text/plain"

            }

        );



    const url =

        URL.createObjectURL(
            blob
        );



    const link =

        document.createElement(
            "a"
        );



    link.href = url;


    link.download = filename;



    document.body.appendChild(
        link
    );



    link.click();



    link.remove();



    URL.revokeObjectURL(
        url
    );



    showToast(

        "File exported",

        "success"

    );


}



/* ==========================================================
   SETTINGS CONTROLS
========================================================== */


function setupModalEvents(){


    const closeExportBtn =

        document.getElementById(
            "closeExportBtn"
        );



    const closeSettingsBtn =

        document.getElementById(
            "closeSettingsBtn"
        );



    closeExportBtn?.addEventListener(

        "click",

        closeExportModal

    );



    closeSettingsBtn?.addEventListener(

        "click",

        closeSettingsModal

    );



    document
    .getElementById("exportTxt")
    ?.addEventListener(

        "click",

        exportTXT

    );



    document
    .getElementById("exportMd")
    ?.addEventListener(

        "click",

        exportMarkdown

    );



    document
    .getElementById("exportJson")
    ?.addEventListener(

        "click",

        exportJSON

    );



}

/* ==========================================================
   TEXTAREA AUTO RESIZE
========================================================== */


function autoResize(){


    if(!messageInput){

        return;

    }



    messageInput.style.height =
        "auto";



    messageInput.style.height =

        Math.min(

            messageInput.scrollHeight,

            220

        ) + "px";


}



/* ==========================================================
   VOICE INPUT
========================================================== */


function setupVoiceInput(){


    if(!voiceBtn){

        return;

    }



    const SpeechRecognition =

        window.SpeechRecognition ||

        window.webkitSpeechRecognition;



    if(!SpeechRecognition){


        voiceBtn.style.display =
            "none";


        return;

    }



    const recognition =

        new SpeechRecognition();



    recognition.lang =
        "en-US";



    recognition.continuous =
        false;



    recognition.interimResults =
        false;



    voiceBtn.addEventListener(

        "click",

        ()=>{


            try{


                recognition.start();



                showToast(

                    "Listening...",

                    "success"

                );


            }

            catch(error){


                console.log(
                    error
                );


            }


        }

    );



    recognition.onresult =

        function(event){


            const text =

                event.results[0][0]
                .transcript;



            messageInput.value +=

                text;



            autoResize();



        };



    recognition.onerror =

        function(){


            showToast(

                "Voice input failed",

                "error"

            );


        };


}



/* ==========================================================
   TEXT TO SPEECH
========================================================== */


function speakText(text){


    if(
        !window.speechSynthesis
    ){

        return;

    }



    speechSynthesis.cancel();



    const speech =

        new SpeechSynthesisUtterance(
            text
        );



    speech.lang =
        "en-US";



    speech.rate =
        1;



    speech.pitch =
        1;



    speechSynthesis.speak(
        speech
    );


}



/* ==========================================================
   IMAGE PREVIEW
========================================================== */


function setupImagePreview(){


    const imagePreview =

        document.getElementById(
            "imagePreview"
        );



    const previewImage =

        document.getElementById(
            "previewImage"
        );



    const closeBtn =

        document.getElementById(
            "closeImagePreview"
        );



    if(
        !imagePreview ||
        !previewImage
    ){

        return;

    }



    document
    .addEventListener(

        "click",

        function(event){



            if(
                event.target.tagName
                === "IMG" &&

                event.target.closest(
                    ".message-body"
                )
            ){


                previewImage.src =

                    event.target.src;



                imagePreview.classList
                    .remove(
                        "hidden"
                    );


            }


        }

    );



    closeBtn?.addEventListener(

        "click",

        ()=>{


            imagePreview.classList
                .add(
                    "hidden"
                );


        }

    );


    imagePreview.addEventListener(

        "click",

        event=>{


            if(
                event.target ===
                imagePreview
            ){

                imagePreview.classList
                    .add(
                        "hidden"
                    );

            }


        }

    );


}



/* ==========================================================
   ATTACHMENT BUTTON
========================================================== */


function setupAttachments(){


    const attachBtn =

        document.getElementById(
            "attachBtn"
        );



    if(!attachBtn){

        return;

    }



    attachBtn.addEventListener(

        "click",

        ()=>{


            showToast(

                "Attachments are not enabled yet",

                "warning"

            );


        }

    );


}



/* ==========================================================
   MOBILE SIDEBAR
========================================================== */


function setupMobileMenu(){


    const menuBtn =

        document.getElementById(
            "menuBtn"
        );



    if(!menuBtn || !sidebar){

        return;

    }



    menuBtn.addEventListener(

        "click",

        ()=>{


            sidebar.classList.toggle(
                "open"
            );


        }

    );


    document.addEventListener(

        "click",

        event=>{


            if(

                window.innerWidth <= 900 &&

                !sidebar.contains(
                    event.target
                ) &&

                !menuBtn.contains(
                    event.target
                )

            ){


                sidebar.classList.remove(
                    "open"
                );


            }


        }

    );


}

/* ==========================================================
   SETTINGS CONTROLS
========================================================== */


function setupSettings(){


    const historyToggle =

        document.getElementById(
            "historyToggle"
        );



    const animationToggle =

        document.getElementById(
            "animationToggle"
        );



    const fontSizeSelect =

        document.getElementById(
            "fontSizeSelect"
        );



    if(historyToggle){


        historyToggle.checked =

            CONFIG.rememberConversation;



        historyToggle.addEventListener(

            "change",

            ()=>{


                CONFIG.rememberConversation =

                    historyToggle.checked;



                if(
                    !CONFIG.rememberConversation
                ){

                    localStorage.removeItem(
                        STORAGE_KEY
                    );


                }



                showToast(

                    CONFIG.rememberConversation

                    ? "Chat history enabled"

                    : "Chat history disabled",

                    "success"

                );


            }

        );


    }



    if(animationToggle){


        const savedAnimation =

            localStorage.getItem(
                "hf_animation"
            );



        animationToggle.checked =

            savedAnimation !== "off";



        animationToggle.addEventListener(

            "change",

            ()=>{


                if(
                    animationToggle.checked
                ){

                    localStorage.removeItem(
                        "hf_animation"
                    );


                    document.body.classList
                        .remove(
                            "reduce-motion"
                        );


                }

                else{


                    localStorage.setItem(

                        "hf_animation",

                        "off"

                    );


                    document.body.classList
                        .add(
                            "reduce-motion"
                        );


                }


            }

        );


    }



    if(fontSizeSelect){


        const savedSize =

            localStorage.getItem(
                "hf_font_size"
            ) || "medium";



        fontSizeSelect.value =
            savedSize;



        applyFontSize(
            savedSize
        );



        fontSizeSelect.addEventListener(

            "change",

            ()=>{


                applyFontSize(

                    fontSizeSelect.value

                );


            }

        );


    }


}



/* ==========================================================
   FONT SIZE
========================================================== */


function applyFontSize(size){


    document.body.dataset.fontSize =
        size;



    document.documentElement.style
        .setProperty(

            "--chat-font-size",

            getFontValue(size)

        );



    localStorage.setItem(

        "hf_font_size",

        size

    );


}



function getFontValue(size){


    switch(size){


        case "small":

            return "14px";



        case "large":

            return "18px";



        default:

            return "15px";


    }


}



/* ==========================================================
   PROMPT CARDS
========================================================== */


function setupPromptCards(){


    const prompts =

        document.querySelectorAll(
            ".prompt-card"
        );



    prompts.forEach(card=>{


        card.addEventListener(

            "click",

            ()=>{


                const text =

                    card.dataset.prompt ||

                    card.innerText;



                messageInput.value =
                    text;



                autoResize();



                messageInput.focus();


            }

        );


    });


}



/* ==========================================================
   MODAL OUTSIDE CLICK
========================================================== */


function setupOutsideModalClose(){


    document.addEventListener(

        "click",

        event=>{


            const modals =

                document.querySelectorAll(
                    ".modal"
                );



            modals.forEach(modal=>{


                if(

                    event.target === modal

                ){


                    modal.classList.add(
                        "hidden"
                    );


                }


            });


        }

    );


}



/* ==========================================================
   KEYBOARD SHORTCUTS
========================================================== */


function setupKeyboardShortcuts(){


    document.addEventListener(

        "keydown",

        event=>{


            /*
              Ctrl + K
              Focus chat input
            */


            if(

                event.ctrlKey &&

                event.key.toLowerCase()
                === "k"

            ){


                event.preventDefault();



                messageInput.focus();


            }



            /*
              Escape
              Close modals
            */


            if(

                event.key === "Escape"

            ){


                document
                .querySelectorAll(
                    ".modal"
                )
                .forEach(modal=>{


                    modal.classList.add(
                        "hidden"
                    );


                });


            }


        }

    );


}



/* ==========================================================
   FINAL UI HELPERS
========================================================== */


function updateModelName(){


    const modelLabel =

        document.getElementById(
            "modelName"
        );



    if(modelLabel){


        modelLabel.textContent =
            CONFIG.model;


    }


}



function checkConnection(){


    if(
        navigator.onLine
    ){

        return true;

    }



    showToast(

        "No internet connection",

        "warning"

    );



    return false;


}



window.addEventListener(

    "offline",

    ()=>{


        showToast(

            "You are offline",

            "warning"

        );


    }

);



window.addEventListener(

    "online",

    ()=>{


        showToast(

            "Connection restored",

            "success"

        );


    }

);



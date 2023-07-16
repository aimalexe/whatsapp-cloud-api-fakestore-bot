const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

module.exports = class WhatsappCloudApi {
    constructor({ graphApiVersion, data }) {

        this.graphApiVersion = graphApiVersion;
        this.bearerToken = process.env.Meta_WA_accessToken;
        this.messagingProduct = 'whatsapp';

        this.senderBusinessPhoneId = data.entry[0].changes[0].value.metadata.phone_number_id;
        this.message = data.entry[0].changes[0].value.messages[0];
        this.recipientName = data.entry[0].changes[0].value.contacts[0].profile.name;;
        this.recipientPhoneNumber = this.message.from;

    }

    getRecipientName(){
        return this.recipientName;
    }

    getRecipientPhoneNumber(){
        return this.recipientPhoneNumber;
    }

    getMessage(){
        return this.message;
    }

    getInteractiveButtonReplyId(){
        return this.message?.interactive?.button_reply?.id;
    }

    //Mark message as read from user
    async markMessageAsRead(messageId) {
        /*
            To Mark a message as read we only need phone id of sender and message id to be marked read.
            It mark all the earlier message's status as read also.
        */

        try {
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages`,
                headers: {
                    'Content-Type': 'application/json',
                    //We can use authorization token issued by META both in headers as well in query /messages?access_token=
                    'Authorization': `Bearer ${this.bearerToken}`
                },
                data: {
                    messaging_product: this.messagingProduct,
                    status: 'read',
                    //to: this.recipientPhoneNumber,
                    message_id: messageId
                }
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }

    // Send a simple text message to a customer
    async sendTextMessage(messageText) {
        try {
            await axios({
                method: 'POST',
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages?access_token=${this.bearerToken}`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    messaging_product: this.messagingProduct,
                    recipient_type: 'individual',
                    to: this.recipientPhoneNumber,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: messageText
                    },
                },
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }

    // Send a simple text message which also include a lists of buttons to a customer
    async sendButtonsMessage(messageText, buttonsList) {
        try {
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages?access_token=${this.bearerToken}`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    messaging_product: this.messagingProduct,
                    recipient_type: 'individual',
                    to: this.recipientPhoneNumber,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: {
                            text: messageText,
                        },
                        action: {
                            buttons: buttonsList.map(button => ({
                                type: 'reply',
                                reply: {
                                    id: button.id,
                                    title: button.title,
                                }
                            })),
                        },
                    },
                }
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }

    // Send a contact card
    async sendContacts(contactsList) {
        try {
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages`,
                headers: {
                    'Content-Type': 'application/json',
                    //We can use authorization token issued by META both in headers as well in query /messages?access_token=
                    'Authorization': 'Bearer ' + this.bearerToken
                },
                data: {
                    messaging_product: this.messagingProduct,
                    to: this.recipientPhoneNumber,
                    type: 'contacts',
                    contacts: contactsList
                }
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }

    // Send radios button for selecting products
    async sendRadioButtons(headerText, bodyText, footerText, sectionsList) {
        try {
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.bearerToken
                },
                data: {
                    messaging_product: this.messagingProduct,
                    recipient_type: 'individual',
                    to: this.recipientPhoneNumber,
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        header: {
                            type: 'text',
                            text: headerText
                        },
                        body: {
                            text: bodyText
                        },
                        footer: {
                            text: footerText
                        },
                        action: {
                            button: 'Select from the list',
                            sections: sectionsList
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }

    // Send image by link to customer
    async sendImageByLink(imageLink, caption) {
        try {
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages`,
                headers: {
                    'Content-Type': 'application/json',
                    //We can use authorization token issued by META both in headers as well in query /messages?access_token=
                    'Authorization': 'Bearer ' + this.bearerToken
                },
                data: {
                    messaging_product: this.messagingProduct,
                    recipient_type: 'individual',
                    to: this.recipientPhoneNumber,
                    type: 'image',
                    image: {
                        link: imageLink,
                        caption: caption
                    }
                }
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }

    // to upload media for getting its id
    async uploadMedia(filePath) {
        try {
            const data = new FormData();
            data.append('messaging_product', this.messagingProduct);
            data.append('file', fs.createReadStream(filePath));

            const response = await axios({
                method: "POST",
                // Note the /media end point
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/media`,
                headers: {
                    'Content-Type': 'application/json',
                    //We can use authorization token issued by META both in headers as well in query /messages?access_token=
                    'Authorization': 'Bearer ' + this.bearerToken,
                    ...data.getHeaders()
                },
                data: data
            });

            return response.data.id;
        } catch (error) {
            console.error(error.response.data);
            return null;
        }

    }

    // Sending the media message
    async sendDocumentMessage(documentPath, caption) {
        // first upload the doc to /media endpoint to get its id
        const docId = await this.uploadMedia(documentPath);

        try {
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages`,
                headers: {
                    'Content-Type': 'application/json',
                    //We can use authorization token issued by META both in headers as well in query /messages?access_token=
                    'Authorization': 'Bearer ' + this.bearerToken
                },
                data: {
                    messaging_product: this.messagingProduct,
                    recipient_type: 'individual',
                    to: this.recipientPhoneNumber,
                    type: 'document',
                    document: {
                        caption: caption,
                        filename: documentPath.split('./')[1],
                        id: docId
                    }
                }
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }

    // sending location message
    async sendLocation(latitude, longitude, address, name) {
        try {
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${this.graphApiVersion}/${this.senderBusinessPhoneId}/messages`,
                headers: {
                    'Content-Type': 'application/json',
                    //We can use authorization token issued by META both in headers as well in query /messages?access_token=
                    'Authorization': 'Bearer ' + this.bearerToken
                },
                data: {
                    messaging_product: this.messagingProduct,
                    recipient_type: 'individual',
                    to: this.recipientPhoneNumber,
                    type: 'location',
                    location: {
                        latitude,
                        longitude,
                        address,
                        name
                    }
                }
            });
        }
        catch (error) {
            console.error(error.response.data);
        }
    }
};
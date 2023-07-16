const router = require('express').Router();
const EcommerceStore = require('../utils/EcommerceStore');
const WhatsappCloudAPI = require('../utils/WhatsappCloudApi');
const CartManager = require('../utils/CartManager');


let store = new EcommerceStore();
const CustomerSession = new Map();

module.exports = router.post('/', async (req, res) => {
    try {
        const data = req.body;

        if (data.object) {
            // Checking If there is a new message
            const isNewMessage = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (isNewMessage) {
                const Whatsapp = new WhatsappCloudAPI({
                    data,
                    graphApiVersion: 'v17.0',
                });

                // Starting Cart Logic:
                if (!CustomerSession.get(Whatsapp.getRecipientPhoneNumber())) {
                    CustomerSession.set(Whatsapp.getRecipientPhoneNumber(), {
                        cart: []
                    });
                }

                let cart = new CartManager(store, CustomerSession);

                if (Whatsapp.getMessage().type === 'text') {
                    const messageBody = Whatsapp.getMessage().text?.body || '';
                    const triggerKeywords = ['hi', 'hello', 'salam', 'hey', 'greetings', 'good morning'];
                    const lowerCaseMessage = messageBody.toLowerCase();

                    // Only Triggering the bot by some given words 
                    const isBotTriggered = triggerKeywords.some(keyword => lowerCaseMessage.includes(keyword));
                    if (isBotTriggered) {
                        // Marking the received msg as read
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);

                        const recipientName = Whatsapp.getRecipientName();
                        const responseMessage = `Hey *${recipientName}*, \nYou are speaking to a chatbot from VS-Code.\nWhat do you want to do next?`;
                        const listOfButtons = [
                            {
                                title: 'View some products',
                                id: 'see_categories',
                            },
                            {
                                title: 'Speak to a human',
                                id: 'speak_to_human',
                            }
                        ];
                        Whatsapp.sendButtonsMessage(responseMessage, listOfButtons)
                    }
                }

                // We have received a quick reply message in response of button clicks
                else if (Whatsapp.getMessage().type === 'interactive') {
                    const replyId = Whatsapp.getInteractiveButtonReplyId();//message?.interactive?.button_reply?.id;

                    // The user has pressed on speak to a human button
                    if (replyId === 'speak_to_human') {
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);

                        const responseMessage = 'Arguably, chatbots are faster than humans.\nCall my human fellow with the below details:'
                        //sendTextMessage(phoneNoId, from, responseMessage);
                        Whatsapp.sendTextMessage(responseMessage);

                        // This is array of objects.
                        const contactsData = [
                            {
                                addresses: [
                                    {
                                        street: "123 Main Street",
                                        city: "Cityville",
                                        state: "Stateville",
                                        zip: "12345",
                                        country: "Countryland",
                                        country_code: "CL",
                                        type: "HOME"
                                    }
                                ],
                                birthday: "1990-01-01",
                                emails: [
                                    {
                                        email: "example@example.com",
                                        type: "WORK"
                                    }
                                ],
                                name: {
                                    formatted_name: "John Doe",
                                    first_name: "John",
                                    last_name: "Doe",
                                    middle_name: "Middle",
                                    suffix: "Jr.",
                                    prefix: "Mr."
                                },
                                org: {
                                    company: "Example Company",
                                    department: "Sales",
                                    title: "Manager"
                                },
                                phones: [
                                    {
                                        phone: "+1234567890",
                                        wa_id: "1234567890",
                                        type: "HOME"
                                    }
                                ],
                                urls: [
                                    {
                                        url: "https://www.example.com",
                                        type: "WORK"
                                    }
                                ]
                            }
                        ];
                        Whatsapp.sendContacts(contactsData);
                    }

                    // The user has prompted to see categories.
                    else if (replyId === 'see_categories') {
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                        Whatsapp.sendTextMessage('Just checking products in store. Wait...')

                        let categories = await store.getAllCategories();

                        const responseMessage = 'We have several categories.\nChoose one of them.';
                        const listOfButtons = categories.data
                            // Making an array for buttons
                            .map(category => ({
                                title: category,
                                id: `category_${category}`
                            }))
                            // Selecting only three categories
                            .slice(0, 3);

                        Whatsapp.sendButtonsMessage(responseMessage, listOfButtons);
                    }

                    // User has replied with a category
                    else if (replyId && replyId.startsWith('category_')) {
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);

                        const selectedCategory = replyId.split('category_')[1];

                        // Retrveing products for the selected category.
                        const productList = await store.getProductsInCategories(selectedCategory);

                        const listOfSections = [
                            {
                                title: `🏆 Top 3: ${selectedCategory}`.substring(0, 24),
                                rows: productList.data
                                    .map((product) => {
                                        //trimming the length of the ID, title, and description in accordance with WhatsApp Cloud API’s radio button (or list) restrictions.
                                        let id = `product_${product.id}`.substring(0, 256);
                                        let title = product.title.substring(0, 21);
                                        let description = `${product.price}\n${product.description}`.substring(0, 68);

                                        return {
                                            id,
                                            title: `${title}...`,
                                            description: `$${description}...`
                                        };
                                    })
                                    .slice(0, 10) //  WhatsApp only allows us a maximum of 10 rows,
                            },
                        ];

                        const header = `#BlackFriday Offers: ${selectedCategory}`;
                        const body = `Our Santa 🎅🏿 has lined up some great products for you based on your previous shopping history.\n\nPlease select one of the products below:`;
                        const footer = 'Powered by: EXE Coding';

                        Whatsapp.sendRadioButtons(header, body, footer, listOfSections);
                    }

                    // User has selected a product from the radio list
                    else if (Whatsapp.getMessage().interactive.type === 'list_reply') {
                        Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                        
                        // Extracting The Selected Product ID:
                        const selectedProductId = Whatsapp.getMessage().interactive.list_reply.id;
                        if (selectedProductId.startsWith('product_')) {
                            // Making the id for fake store:
                            const productId = selectedProductId.split('_')[1];

                            // searching for product:
                            const product = await store.getProductById(productId);
                            const { price, title, description, category, image: imageUrl, rating } = product.data;

                            // Render star emoji using the emojiRating function. If a rating is 3.8, it will render three star emojis
                            const emojiRating = (rvalue) => {
                                rvalue = Math.floor(rvalue || 0); // generate as many star emojis as whole number ratings
                                let output = [];
                                for (var i = 0; i < rvalue; i++) output.push('⭐');
                                return output.length ? output.join('') : 'N/A';
                            };

                            //Send an image with caption of the product
                            let text = `_Title_: *${title.trim()}*\n\n`;
                            text += `_Description_: ${description.trim()}\n\n`;
                            text += `_Price_: $${price}\n`;
                            text += `_Category_: ${category}\n`;
                            text += `${rating?.count || 0} shoppers liked this product.\n`;
                            text += `_Rated_: ${emojiRating(rating?.rate)}\n`;
                            await Whatsapp.sendImageByLink(imageUrl, text);

                            // Send some buttons to engage user.
                            const buttonsText = `Here is the product, what do you want to do next?`;
                            const buttonsList = [
                                {
                                    title: 'Add to cart🛒',
                                    id: `add_to_cart_${productId}`,
                                },
                                {
                                    title: 'Speak to a human',
                                    id: 'speak_to_human',
                                },
                                {
                                    title: 'See more products',
                                    id: 'see_categories',
                                },
                            ];
                            await Whatsapp.sendButtonsMessage(buttonsText, buttonsList);
                        }
                    }

                    // Customer want to add a product to its cart
                    else if (replyId && replyId.startsWith('add_to_cart_')) {
                        const productId = replyId.split('add_to_cart_')[1];
                        await cart.addProduct({ product_id: productId, recipientPhone: Whatsapp.getRecipientPhoneNumber() });

                        let cartItemsCount = cart.listOfItemsInCart({ recipientPhone: Whatsapp.getRecipientPhoneNumber() }).count;

                        // Send some buttons
                        const buttonsText = `Your cart has been updated.\nNumber of items in cart: ${cartItemsCount}.\n\nWhat do you want to do next?`;
                        const buttonsList = [{
                            title: 'Checkout 🛍️',
                            id: `checkout`,
                        },
                        {
                            title: 'See more products',
                            id: 'see_categories',

                        }];
                        await Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                        await Whatsapp.sendButtonsMessage(buttonsText, buttonsList);
                    }

                    // Customer want to check out its cart
                    else if (replyId === 'checkout') {
                        let finalBill = cart.listOfItemsInCart({ recipientPhone: Whatsapp.getRecipientPhoneNumber() });
                        let invoiceText = `List of items in your cart:\n`;

                        finalBill.products.forEach((item, index) => {
                            let serialNo = index + 1;
                            invoiceText += `\n#${serialNo}: ${item.title} @ $${item.price}`;
                        });

                        invoiceText += `\n\nTotal: $${finalBill.total}`;
                        const recipientName = Whatsapp.getRecipientName();

                        store.generatePDFInvoice({
                            order_details: invoiceText,
                            file_path: `./invoice_${recipientName}.pdf`,
                        });

                        await Whatsapp.sendTextMessage(invoiceText);

                        const buttonsText = `Thank you for shopping with us, ${recipientName}.\n\nYour order has been received & will be processed shortly.`;
                        const buttonsList = [{
                            title: 'See more products',
                            id: 'see_categories',
                        },
                        {
                            title: 'Print my invoice',
                            id: 'print_invoice',
                        }];

                        await Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                        await Whatsapp.sendButtonsMessage(buttonsText, buttonsList);
                    }

                    // Customer want to print its invoice
                    else if (replyId === 'print_invoice') {
                        await Whatsapp.markMessageAsRead(Whatsapp.getMessage().id);
                        const recipientName = Whatsapp.getRecipientName();

                        // send invoice in document message
                        const caption = `fake shop invoice #${recipientName}`;
                        const filePath = `./invoice_${recipientName}.pdf`;

                        await Whatsapp.sendDocumentMessage(filePath, caption);

                        // Send the location of our pickup station to the customer, so they can come and pick up their order
                        const warehouse = store.generateRandomGeoLocation();

                        const text = 'Your order has been fulfilled. Come and pick it up, as you pay, here:';
                        await Whatsapp.sendTextMessage(text);

                        const shopName = 'fake shop powered by EXE Coding'
                        await Whatsapp.sendLocation(warehouse.latitude, warehouse.longitude, warehouse.address, shopName);
                    }
                }
            }

            res.status(200).send();
        }
        else {
            res.status(404).send();
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send();
    }
});
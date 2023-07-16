# WhatsApp Cloud API Fake Stor Chatbot

This project is a WhatsApp bot for a store, designed to interact with customers and provide information about products, categories, and other store-related queries. The bot utilizes the WhatsApp Cloud API and integrates with the FakeStore API to fetch product information.

## Prerequisites

- Node.js (version 14.18.1 or higher)
- npm package manager
- ngrok (for local development and testing)

## Installation

1. Clone the repository: `git clone https://github.com/aimalexe/whatsapp-cloud-api-fakestore-bot.git`
2. Install the dependencies: `cd whatsapp-cloud-api-fakestore-bot && npm install`

3. Set up ngrok:

- Install ngrok globally from its website and add to path or run:

  ```
  npm install -g ngrok
  ```

- Start ngrok to tunnel your local server:

  ```
  ngrok http 9000
  ```

- Take note of the ngrok provided URL, which will be used for configuring your WhatsApp Cloud API development app.

4. Configure the app:

- Create a developer account and app on the Meta (formerly Facebook) developer platform.

- Configure your app with the following settings:
  - Base URL/Callback URL: Use the ngrok URL (e.g., `https://12345678.ngrok.io`) for development purposes.
  - Incoming Webhooks: Enable incoming webhooks and provide the ngrok URL as the webhook URL.

- Obtain the necessary credentials (access token, client ID, etc.) from the developer platform and update the configuration file (`.env.js`) in your project.

5. Start the bot: `nodemon app.js`


The bot should now be running and ready to handle incoming WhatsApp messages.

## Usage

Once the bot is running and properly configured, it can respond to various commands and queries from WhatsApp users. Here are some example commands:

- Fetches a list of available product categories.
- Provides contact information for speaking with a human representative.
- Sends information about a specific product.
- Generates and sends an invoice for a product.
- Sends an image to the user.
- Sends a location pin to the user.
- Sends radio buttons
- etc

Feel free to explore the code and modify it according to your specific requirements.

## Dependencies

- express
- ngrok
- axios
- pdfkit
- form-data

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please submit an issue or a pull request.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
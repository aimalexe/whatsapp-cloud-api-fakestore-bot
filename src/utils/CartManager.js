module.exports = class CartManager {
    constructor(store, customerSession) {
        this.store = store;
        this.customerSession = customerSession;
    }

    async addProduct({ product_id, recipientPhone }) {
        let product = await this.store.getProductById(product_id);
        if (product.status === 'success') {
            this.customerSession.get(recipientPhone).cart.push(product.data);
        }
    }

    listOfItemsInCart({ recipientPhone }) {
        let total = 0;
        let products = this.customerSession.get(recipientPhone).cart;
        total = products.reduce(
            (acc, product) => acc + product.price,
            total
        );
        let count = products.length;
        return { total, products, count };
    }

    clearCart({ recipientPhone }) {
        this.customerSession.get(recipientPhone).cart = [];
    };
};

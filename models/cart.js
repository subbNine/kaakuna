// Cart Constructor
module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function(item, id, qty, storeUrl) {
        var qty = +qty || 1;
        // var platform = body.platform;
        // var addon = body.addon; // Array
        var priceField = item.discount ? 'newPrice' : 'price'; // 'price' || 'newPrice'

        var storedItem = this.items[id];
        if (!storedItem) {
            storedItem = this.items[id] = { item: item, qty: 0, price: 0 };
        }
        if(storeUrl)storedItem.storeUrl = storeUrl;
        storedItem.qty += qty; // Qty of added product
        storedItem.price = Math.round(item[priceField] * storedItem.qty * 100) / 100; // Total price of one product
        this.totalPrice += Math.round(item[priceField] * qty * 100) / 100; // Total price of cart
        this.totalQty += qty; // Qty of products in cart
    };

    this.reduceByOne = function(id) {
        if(this.items[id].qty>0){
            console.log({qty: this.items[id].qty})
            this.items[id].qty--;
            this.items[id].price -= this.items[id].item.price;
            this.totalQty--;
            this.totalPrice -= this.items[id].item.price;
        }
        // if (this.items[id].qty <= 0) {
        //     delete this.items[id];
        // }
    };

    this.increaseByOne = function(id) {
        console.log({qty: this.items[id].qty})
        this.items[id].qty++;
        this.items[id].price += this.items[id].item.price;
        this.totalQty++;
        this.totalPrice += this.items[id].item.price;
    };

    this.removeItem = function(id) {
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
    };

    /* Convert Object to Array */
    this.generateArray = function() {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };

    this.productIds = function() {
        return Object.keys(this.items);
    };

    this.minQty = function() {
        var arr = [];
        for (var id in this.items) {
            arr.push(+this.items[id].qty);
        }
        return Math.min(...arr);
    };
};
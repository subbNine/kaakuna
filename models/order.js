var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userStatus = ['client', 'staff', 'admin', 'guest'];

var schema = new Schema({
    userStatus: { type: String, enum: userStatus },
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    cart: { type: Object, required: [true, 'Order should have a shoppinglist'] },
    isDelivered: { type: Boolean, default: false },
    createAt: { type: Date, default: Date.now() },
    address: { type: String, required: [true, 'Order should have a delivery address'] },
    username: { type: String, required: [true, 'Order should have a User name'] },
    paymentId: { type: String, required: [true, 'Order should have a paymentId'] },
    key1: { type: String, default: null },
    key2: { type: String, default: null }
});

schema.methods.encryptKey = function(key) {
    return bcrypt.hashSync(key, bcrypt.genSaltSync(5), null);
};

schema.methods.validKey = function(key) {
    return bcrypt.compareSync(key, this.key1);
};

module.exports = mongoose.model('Order', schema);
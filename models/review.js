/****************************************
 * Only registered user can create      *
 * review and who is bought the product *
 ****************************************/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var review = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'products', required: [true, 'Review should have the product ID'] },
    goodSide: { type: String, maxlength: 300, default: 'I did not find.' },
    badSide: { type: String, maxlength: 300, default: 'I did not find.' },
    addition: { type: String, maxlength: 300, required: [true, 'Please, describe this product.'] },
    users: { type: [Schema.Types.ObjectId], ref: 'users', default: [] },
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: [true, 'Review should have the user ID'] }, // for link
    username: { type: String, required: [true, 'Review should have the authors name'] },
    isShow: { type: Boolean, default: false },
    rating: { type: Number, required: [true, 'Review should have a rating'] },
    createAt: { type: Date, default: Date.now() },
    city: String
});

module.exports = mongoose.model('review', review);
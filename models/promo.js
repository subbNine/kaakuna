var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    title: { type: String, required: [true, 'Promo should have a title'] },
    body: { type: String, required: [true, 'Promo should have a description'] },
    discount: { type: Number, min: 0, required: [true, 'Promo should have a discount'] },
    start: { type: Date, required: [true, 'Promo should have a start date'], default: Date.now() },
    end: { type: Date, required: [true, 'Promo should have an end date'] },
    products: { type: [Schema.Types.ObjectId], ref: 'Products' }
});

module.exports = mongoose.model('Promo', schema);
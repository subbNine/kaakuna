var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const category = new Schema({
    path: String,
    prev_node: String,
    node_name: String,
    icon_class: String,
    // nextNode: String.
    node_type: {type: String, enum: ["ROOTNODE", "INTERMEDIATENODE", "LEAFNODE"], uppercase: true}
});


module.exports = {};
module.exports.Category = mongoose.model('category', category);

// const storeItemCategory = new Schema({
//     category_name: {type: String, lowercase: true},
//     image_path: String,
//     icon_class: String,
//     store: {type:Schema.Types.ObjectId, ref: 'store'},
//     subCategories:{type:[ storeItemSubCategory
//             // {subcategory:{
//             //     type:Schema.Types.ObjectId, 
//             //     ref: 'storeItemSubCategory'
//             //     }, 
//             // subcategory_name: String
//             // }
//         ]
//     }
// });

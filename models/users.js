var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var SALT_FACTOR = 10;

// var userStatus = ['client', 'staff', 'admin', 'curier'];

var usersAddress = new Schema({
    state: String,
    city: String,
    LGA: String,
    streetAddress: String,
    postalCode: String,
    closestLandmark: String,
    user: {type: Schema.Types.ObjectId, ref: 'User'}
});

var userSchema = new Schema({
    name:{first: String,
    last: String},
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true, 
        // set: val => bcrypt.genSalt(SALT_FACTOR, (err, salt) => bcrypt.hash(val, salt, null,(err, hashedPassword)=>hashedPassword))
    },
    telephone: { type: String},
    address: {type: Schema.Types.ObjectId, ref: 'userAddress'},   // easy to scale; address can be made an array or map type
    // stores: [{store:{type: Schema.Types.ObjectId, ref: 'Store'}, role:{type: String, enum:['vendor', 'store manager']}}],
    stores: {type:[
                    {storeid:{type: Schema.Types.ObjectId, ref: 'Store'}, 
                    storename: String, storeurl: String, datecreated: String,
                    role:{type: String, enum:['vendor', 'store manager']}}], default: undefined}

});

userSchema.methods.checkPassword = function(guess, done) {
    return bcrypt.compare(guess, this.password, (err, isMatch)=> done(err, isMatch));
};

var noop = function() {
    console.log('harshing password');
};
userSchema.pre("save", function(done) {
    var user = this;
    if (!user.isModified("password")) {
        return done();
    }
    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) { return done(err); }

        bcrypt.hash(user.password, salt, noop, function(err, hashedPassword) {
            if (err) { return done(err); }

            user.password = hashedPassword;
            done();
        });
    });
});

var Address = mongoose.model('userAddress', usersAddress)
var User = mongoose.model('User', userSchema);

module.exports = {};
module.exports.User = User;
module.exports.Address =  Address;
jQuery.fn.extend({
    live: function (event, callback) {
    if (this.selector) {
            jQuery(document).on(event, this.selector, callback);
        }
        return this;
    }
});

// contains all the logic to add products on store page
$(document).ready(function(){ 
    
});
const minfroutes = {};
const minfhandlers = {};
const minfviews = {};
var minfcontainer = undefined;
var minfOldRoute = '';
// register route handlers
// const minfhandler = function(name, handlerFunc){
//     return minfhandlers[name] = handlerFunc;
// };

// define routes
// when you specify a route with its handler 
// the handler is a function that returns a view
const minfroute = function(path, handler, ...callbacks){
	if(callbacks){
		minfroutes[path] = {callbacks: callbacks};
	}
	
    if(typeof(handler) === 'function'){
		minfviews[path] = handler();	
	}
    else{
        return;
    }
};

const minfgetView = function(route){
	if(!minfviews[route]){
		try{
			return minfviews['*']
		}
		catch(err){
			minfviews['*'] = '<p>not found<p/>'
			return minfviews['*']
		}
    }else{
		console.log(route)
        return minfviews[route];
    }
};

const minfresolveRoute = function(route){
    // console.log(minfroutes);
	if(minfOldRoute && minfOldRoute in minfviews){ 
		if(minfcontainer && minfcontainer.innerHTML){
			minfviews[minfOldRoute] = minfcontainer.innerHTML;
			
		}
	}
	minfOldRoute = route;
	minfcontainer.innerHTML = minfgetView(route);	
	
	var callbacks = minfroutes[route].callbacks
	if(callbacks && callbacks.length){
		callbacks.forEach(callback=>callback());
	}
};

const minfrouter = (evt) => {
    const url = window.location.hash.slice(1) || "/";
    minfresolveRoute(url);
};

const minfredirect = (redirectTo)=>{
    window.location.hash = redirectTo;
}

function minfsetContainer(containerDiv){
	minfcontainer = containerDiv;
}

// For first load or when routes are changed in browser url box.
window.addEventListener('load', minfrouter);
window.addEventListener('hashchange', minfrouter);
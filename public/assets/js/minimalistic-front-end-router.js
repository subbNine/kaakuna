const minfroutes = {};
const minfhandlers = {};
var minfcontainer = undefined;
// register route handlers
const minfhandler = function(name, handlerFunc){
    return minfhandlers[name] = handlerFunc;
};

// define routes
// when you specify a route with its handler 
// the handler can either be a function or a string that represents
// the name of an already registered handler
const minfroute = function(path, handler){
    if(typeof(handler) === 'function'){
        return minfroutes[path] = handler;
    }else if(typeof(handler) === 'string'){
        return minfroutes[path] = minfhandlers[handler];
    }else{
        return;
    }
};

const minfresolveRoute = function(route){
    // console.log(minfroutes);
    if(!minfroutes[route]){
        return minfroutes['*']
    }else{
        return minfroutes[route];
    }
};

const minfrouter = (evt) => {
    if(minfcontainer){
        minfcontainer.innerHTML = ''
    }
    const url = window.location.hash.slice(1) || "/";
    const routeResolved = minfresolveRoute(url);
    routeResolved();
};

const minfredirect = (redirectTo)=>{
    window.location.hash = redirectTo;
}

// For first load or when routes are changed in browser url box.
window.addEventListener('load', minfrouter);
window.addEventListener('hashchange', minfrouter);
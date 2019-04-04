'use strict'
const minfroutes = {};
const minfhandlers = {};
const minfviews = {};
var minfcontainer = undefined;
var minfOldRoute = '';

// define routes.
// you specify a route path (1st parameter) with its view (2nd parameter),
// the view (2nd parameter) may be a function that returns a view
// or a function that returns an id to a view container which is inside your html.
// In the 2nd case (where a function returns an id to a view container) ensure that you
// define a css class of type hidden. this class should have a property 'display: none'.
// finally, in your view add this css class to your class attribute
// you dont need to follow this procedure if you're going to return a view in the 2nd parameter
const minfroute = function(path, view, ...callbacks){
	if(callbacks){
		minfroutes[path] = {callbacks: callbacks};
	}
	
    if(typeof(view) === 'function'){
		minfviews[path] = view();	
	}
	else if(typeof(view) === 'string'){
		minfviews[path] = view;
	}
    else{
        return;
    }
};

function minfgetView(route){
	if(!minfviews[route]){
		try{
			return minfgetView('*');
		}
		catch(err){
			if(!minfcontainer){
				var minfElem = document.getElementById(Object.values(minfviews)[0]);
				console.log(minfviews)
				const minfNullRoute = 'minfNullRoute';
				minfElem.insertAdjacentHTML("beforebegin",
											`<p id='${minfNullRoute}' class='hidden'>
												Oops! This route is not defined</p>`);
				minfviews['*'] = minfNullRoute;
				return minfviews['*']
			}

			minfviews['*'] = "<p>Oops! This route is not defined</p>";
			return minfviews['*'];
		}
    }else{
        return minfviews[route];
    }
};

function minfresolveRoute(route){
	if(minfOldRoute && minfOldRoute){ 
		if(minfcontainer && minfcontainer.innerHTML){
			minfviews[minfOldRoute] = minfcontainer.innerHTML;	
		}else{
			var prevViewId = document.getElementById(minfgetView(minfOldRoute).startsWith('#')
												?minfgetView(minfOldRoute).slice(1)
												:minfgetView(minfOldRoute));
			prevViewId.classList.add('hidden');
		}
	}
	
	minfOldRoute = route;
	if(minfcontainer && minfcontainer.innerHTML){
		minfcontainer.innerHTML = minfgetView(route);	
	}else{
		var currentViewId = document.getElementById(minfgetView(route).startsWith('#')
												?minfgetView(route).slice(1)
												:minfgetView(route));
		currentViewId.classList.remove('hidden');
	}

	var callbacks = minfroutes[route] && minfroutes[route].callbacks? minfroutes[route].callbacks:''
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
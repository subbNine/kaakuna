'use strict'

function Minf(options){
	if(!new.target){
		return new Minf(options);
	}

	const isSetOptions = typeof(options)==='object' && Object.keys(options).length;

	this.routeCallbacks = {};
	this.routeViews = {};
	this.previousRoute = undefined;

	this.container = undefined;

	// If the route handler you will pass to minfroute function -defined above- returns a view container,
	// then the argument you pass to this function should be the id to the container you
	// want the view to be displayed in
	this.setContainer = (containerDiv)=>{
		try{
			var content = containerDiv.innerHTML;
		} catch(err){
			var content = document.getElementById(containerDiv).innerHTML;
		}
		this.container = content.trim()? undefined: containerDiv;
	};

	this.redirect = function(redirectTo){
		console.info('redirecting to #'+redirectTo)
		window.location.hash = redirectTo;
	}

	if(isSetOptions && options.container){
		this.setContainer(options.container);
	}

	// define routes.
	// you specify a route path (1st parameter) with its view (2nd parameter),
	// the view (2nd parameter) may be a function that returns a view
	// or a function that returns an id to a view container which is inside your html.
	// In the 2nd case (where a function returns an id to a view container) ensure that you
	// define a css class of type hidden. this class should have a property 'display: none'.
	// finally, in your view add this css class to your class attribute
	// you dont need to follow this procedure if you're going to return a view in the 2nd parameter
	this.route = (path, view, ...callbacks)=>{
		if(callbacks){
			this.routeCallbacks[path] = {callbacks: callbacks};
		}
		
		if(typeof(view) === 'function'){
			this.routeViews[path] = view(this);	
		}
		else{
			this.routeViews[path] = view;
		}

		// it is assumed that if this.container is not set, then views are passed in via view id
		if(this.routeViews[path] && !this.container){
			var elem = document.getElementById(this.routeViews[path])
			elem.hidden = elem.hidden || !elem.hidden
		}	
	};

	this.getViewFromPath = (route)=>{
		if(!(route in this.routeViews)){
			try{
				return this.getViewFromPath('*');
			}
			catch(err){
				if(isSetOptions && options.nullrouteRedirect){
					this.routeCallbacks['*'] = {callbacks: []}
					this.routeCallbacks['*'].callbacks.push(()=>{
						this.redirect(options.nullrouteRedirect);
					});
					return;
				}

				if(!this.container){
					var elem = document.getElementById(Object.values(this.routeViews)[0]);
					// this.console.log(routeViews)
					const NULLROUTE = 'minfNullRoute';
					elem.insertAdjacentHTML("beforebegin",
												`<p id='${NULLROUTE}' hidden>
													Oops! This route is not defined</p>`);
					this.routeViews['*'] = NULLROUTE;
					return this.routeViews['*']
				}
				
				this.routeViews['*'] = "<p>Oops! This route is not defined</p>";
				return this.routeViews['*']
			}
		}
		else{
			return this.routeViews[route];
		}
	};
	
	this.resolveRoute = (route)=>{
		const previousRoute = this.previousRoute;
		const routeViews = this.routeViews;
		const getViewFromPath = this.getViewFromPath;
		const container = this.container;
		const routeCallbacks = this.routeCallbacks;

		// a route may be specified to trigger a function but not change the current view.
		// such route would have null or undefined registered as handler
		// in such a case the registered "dummy" handler (null or undefined) should not be altered.
		if(previousRoute && !((previousRoute in routeViews) && !routeViews[previousRoute])){ 
			if(container && container.innerHTML){
				routeViews[previousRoute] = container.innerHTML;	
			}else{
				var fromView = getViewFromPath(previousRoute) 
				if(!((route in routeViews) && !routeViews[route]) && fromView){
					var prevViewId = document.getElementById(
														fromView.startsWith('#')
														?fromView.slice(1)
														:fromView
														);
					prevViewId.hidden = true;
				}
				
			}
		}
		
		// in case null or undefined is used for route handler.
		// in this case they're referred to as "dummy" handlers,
		// since they dont change views but merely carry out specific functions
		if(!((route in routeViews) && !routeViews[route])){
			if(container && container.innerHTML){
				if(getViewFromPath(route)){
					container.innerHTML = getViewFromPath(route);	
				}
			}else{
				var curView = getViewFromPath(route);
				if(curView){
					var currentViewId = document.getElementById(curView.startsWith('#')
																?curView.slice(1)
																:curView);
					currentViewId.hidden = false;
				}
			}
			this.previousRoute = route;
		}
	
		var callbacks = routeCallbacks[route] && routeCallbacks[route].callbacks || 
						routeCallbacks['*'] && routeCallbacks['*'].callbacks
						? routeCallbacks[route] && routeCallbacks[route].callbacks
							? routeCallbacks[route].callbacks
							:routeCallbacks['*'] && routeCallbacks['*'].callbacks
							:''
		// console.log({callbacks, routeCallbacks: routeCallbacks['*'].callbacks})
		if(callbacks && callbacks.length){
			callbacks.forEach(callback=>callback(this));
		}
	};

	this.minfrouter = (evt) => {
		const url = window.location.hash.slice(1) || "/";
		this.resolveRoute(url);
	};

	// For first load or when routes are changed in browser address field.
	window.addEventListener('load', this.minfrouter);
	window.addEventListener('hashchange', this.minfrouter);
}
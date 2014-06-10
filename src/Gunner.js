(function () {
    "use strict";
    //     Gunner.js 0.0.1
    //     (c) 2014 Abraham Haskins
    //     Gunner may be freely distributed under the MIT license.

    // Our main Gunner class which takes the URL of the data we are looking to retreive and manipulate.

    // For example `new Gunner("http://api.reddit.com/user/unidan/")`
    var Gunner = function (resource) {

        // Initial setup
        // --------------

        // Gunner takes a "resource" which is either a URL or an Object.
        if (typeof resource == "string") {
            this.url = resource;
        }else{
            this.url = false;   
        }

        if (typeof resource == "object") {
            this.initialData = resource;   
        }else{
            this.initialData = false;   
        }

        // The object containing reloader information
        this.reloaderStrs = {};

        // All data loaded from URL and reloads, used for `Gunner.recoil`
        this.rawData = [];

        // The default projectile is `"*"` i.e. all children of data
        this.projectileStr = "*";

        // The total HTTP requests made, used for `Gunner.limit`
        this.fetches = 0;

        // The total HTTP requests we can make, used for `Gunner.limit`
        this.limitInt = 1;

        // The delay (in milliseconds) between each HTTP request, used for `Gunner.delay`
        this.delayInt = 0;

        // Our definition of self.
        var self = this;

        // Our projectile data.
        var projectileBlob;
        
        // Query data
        this._queryData = {};

        // Exported Methods
        // --------------

        // The `Gunner.fire` method is used to activate the Gunner (i.e. make HTTP requests, parse data, etc). The projectiles are passed to the callback as an array of data shaped by string passed to `Gunner.projectile`.
        this.fire = function (callback) {
            self._fetch(callback);
        };

        // The `Gunner.rapidfire` is similar to `Gunner.fire` except that instead of having the callback called once with an array containing the data, it is called once for each protectile in the array.
        this.rapidfire = function (callback) {
            self._fetch(function (projectiles) {
                self._each(projectiles, function (projectile) {
                    callback(projectile);
                });
            });
        };

        // The `Gunner.reloader` method is used for dealing with paginated content. It takes an object of reloader strings like `{after: "data.after"}` and stores it in the Gunner. After the initial URL provided to the Gunner is loaded, another URL will be loaded which has the added query data `?after={{data.after}}` with the value for `data.after` being pulled from the data for the first page. 
        this.reloader = function (reloaderStrs) {
            self.reloaderStrs = reloaderStrs;
            return self;
        };

        // The `Gunner.limit` method is used for limiting the number of HTTP requests when a reloader is used. Theoredically, a reloader could be used to load an infinite amount of pages, which may not be what we want. The `limit` method takes a number and will not let the total page requests from this Gunner exceed that number.
        this.limit = function (limit) {
            self.limitInt = limit;
            return self;
        };

        // The `Gunner.fetcher` adds a callback to be called as pages are being fetched. The `fetcherFunc` will be passed the current number of HTTP requests and the limit (if any).
        this.fetcher = function (fetcherFunc) {
            self.fetcherFunc = fetcherFunc;
            return self;
        };

        // The `Gunner.delay` method is used for adding a delay between HTTP requests when a reloader is used. This method takes a number of millseconds and delays each HTTP request by that amount of time.
        this.delay = function (delayInt) {
            self.delayInt = delayInt;
            return self;
        };

        // The `Gunner.projectile` method is used for defining the shape of the data passed to `Gunner.fire`'s callback. An example `projectileStr` would be `"data.children.*.data.title"`. This tells the Gunner to fire the data in `dataFromURL['data']['children'][*]['data']['title']`. This syntax should be familiar to any developer with the exception of the special `*` field. This character is the single most important concept when building a Gunner. It acts as a wild card and allows us to get a list of titles from all the children, not just a specific one.
        this.projectile = function (projectileStr) {
            self.projectileStr = projectileStr;
            return self;
        };

        // The `Gunner.recoil` method is typically used from within the `Gunner.fire` callback. This method will take a single projectile and return the parent(s) of that projectile. For example, if we have our projectile set as `"data.children.*.data.title"`, then our projectile will be the value of `title`. In order to access the complete child's data, we can `Gunner.recoil` the `title` and we will receive the `data` object which has the `title` field. It is important to note that *this method returns a list of matches, not a single match* due to the fact that there is no guarantee that the projectile provided will be unique.
        this.recoil = function (projectile) {
            return self._getField(self.rawData, self.projectileStr, projectile);
        };

        this.getter = function (getterFunc) {
            self._getterFunc = getterFunc;  
            return self;
        };
        
        this.query = function (queryData) {
            self._queryData = queryData;
            return self;
        };

        // Internal Methods
        // --------------

        // The `Gunner._fetch` method kicks off loading data for the Gunner.
        this._fetch = function (callback, projectileBlob, queryData) { 
            if (self.limitInt && self.fetches++ == self.limitInt) {
                callback(projectileBlob, self);
                return;
            }else if (self.fetcherFunc) {
                self.fetcherFunc(self.fetches, self.limitInt);  
            }

            var queryData = self._queryData || {};
            this._each(reloaderData, function (value, obj, key) {
                queryData[key] = value;
            }); 

            if (self.url) {
                self._getterFunc(self.url, queryData, callback).then(self._processIncoming);
            }else{
                self._processIncoming(self.initialData, callback);
            }
        };

        // The `Gunner._processIncoming` processes incoming data by dealing with the `projectilePartial` received from a single HTTP request. 
        this._processIncoming = function (data, callback) {    
            var deffered = self._defer();

            self.rawData.push(data);
            var projectilePartial = self._getField([data], self.projectileStr);

            if (!projectileBlob) {
                projectileBlob = [];   
            }

            var partials = projectilePartial.length;
            self._each(projectilePartial, function (chunk) {
                projectileBlob.push(chunk);
            });     

            self._reload(data, projectileBlob, callback);
        };

        // The `Gunner._reload` is called after processing incoming data. If a reload can be done, then `_fetch` will be called again with the reloaded URL.    
        this._reload = function (data, blob, callback) {
            var reloaders = {};
            var hasReloader = false;

            for (var reloaderKey in self.reloaderStrs) {
                var reloader = self.reloaderStrs[reloaderKey];
                reloaders[reloaderKey] = self._getField([data], self.reloaderStrs[reloaderKey])[0];  
                hasReloader = reloaders[reloaderKey] || hasReloader;
            }

            if (hasReloader && self.url) {
                setTimeout(function () {
                    self._fetch(callback, blob, reloaders);
                }, self.delayInt);
            }else{
                callback(blob, self);
                return;
            }         
        };

        // The `Gunner._getField` method is the method used to parse and fetch data pased on a `projectileStr` (or `fieldStr`). This method takes an array of pools, a field string, and an optional target.
        this._getField = function (pools, fieldsStr, target) {
            var fields = fieldsStr.split('.');
            var targets = [];
            var newPools = [];

            var addToPool = function (item, pool, child) {
                newPools.push(item);
                if (item == target) {
                    targets.push(pool);
                }
            };

            for (var f=0; f<fields.length; f++) {
                var field = fields[f];
                newPools = [];

                for (var p=0; p<pools.length; p++) {
                    var pool = pools[p];
                    if (field == "*") {
                        self._each(pool, addToPool);
                    }
                    else if (pool[field]) {
                        newPools.push(pool[field]);
                        if (pool[field] == target) {
                            targets.push(pool);
                        }
                    }
                }
                pools = newPools;
            }

            if (target) {
                return targets;   
            }else{
                return pools;
            }
        };

        // The `Gunner._each` is a utility method for looping through arrays or objects. 
        this._each = function (obj, func) {
            var child;
            if (self._isArray(obj)) {
                for (child=0; child<obj.length; child++) {
                    func(obj[child], obj, child);
                }
            }
            else {
                for (child in obj) {
                    func(obj[child], obj, child);
                }
            }       
        };

        // The default `Gunner._getterFunc` method is used for requesting data via XHR.
        this._getURL =  function (src, data, userdata) {
            var deferred = self._defer();
            if (!isNode) {
                var queryPairs = [];
                var queryString = "";

                for (var field in data) {
                    queryPairs.push(field + "=" + data[field]);
                }

                if (queryPairs.length) {
                    queryString = "?" + queryPairs.join("&");
                }

                var reqListener = function (res) {
                    deferred.resolve(JSON.parse(res.responseText || res.currentTarget.responseText), userdata);
                };

                var xhr = new XMLHttpRequest();
                xhr.onload = reqListener;
                xhr.open("get", src + queryString, true);
                xhr.send(); 

                return deferred.promise;
            }else{
                // This is why Node is better...
                request.get(src + "?" + qs.stringify(data), function (err, resp, body) {
                    deferred.resolve(JSON.parse(body), userdata);
                });
                return deferred.promise;
            }
        };

        this._getterFunc = this._getURL;

        // The `Gunner._defer` is a minimalist promise implemtation used in `Gunner._getURL`.
        this._defer = function () {
            var local = {};

            local.promise = {
                then: function (callback) {
                    local.callback = callback;
                    if (local.resolved) {
                        local.finish();
                    }
                }
            };

            local.resolve = function () {
                local.args = arguments;
                if (local.callback) {
                    local.finish();
                }
                local.resolved = true;
            };

            local.finish = function () {
                local.callback.apply(self, local.args);
            };

            return local;
        };

        this._isArray = function (obj) {
            return toString.call(obj) == '[object Array]';        
        };

        return this;
    };

    // Inspired by http://stackoverflow.com/a/5197219/1570248
    var isNode, request, qs, root=this;
    if (typeof module !== 'undefined' && module.exports) {
            if (root) {root.Gunner = Gunner;}
            module.exports = Gunner;
            isNode = true;
            request = require('request');
            qs = require('querystring');
    } else {
            root.Gunner = Gunner;
            isNode = false;
    }
}());
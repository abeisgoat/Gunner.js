//     Cannon.js 0.0.1
//     (c) 2014 Abraham Haskins
//     Cannon may be freely distributed under the MIT license.

// Our main Cannon class which takes the URL of the data we are looking to retreive and manipulate.

// For example `new Cannon("http://api.reddit.com/user/unidan/")`
var Cannon = function (url) {
    
    // Initial setup
    // --------------
    
    // The URL this Cannon loads data from.
    this.url = url;
    
    // The object containing reloader information
    this.reloaderStrs = {};
    
    // The default projectile is "*" i.e. all children of data
    this.projectileStr = "*";
    
    // All data loaded from URL and reloads, used for Cannon.recoil()
    this.rawData = [];
    
    // The total HTTP requests made, used for Cannon.limit()
    this.fetches = 0;
    
    // The delay (in milliseconds) between each HTTP request, used for Cannon.delay()
    this.delayInt = 0;
    
    // Our definition of self.
    var self = this;
    
    this.fire = function (callback) {
        self._fetch(callback);
        return self;
    };
    
    this.reload = function (reloaderStrs) {
        self.reloaderStrs = reloaderStrs;
        return self;
    };
    
    this.limit = function (limit) {
        self.limitInt = limit;
        return self;
    };
    
    this.delay = function (delayInt) {
        self.delayInt = delayInt;
        return self;
    };
    
    this.projectile = function (projectileStr) {
        self.projectileStr = projectileStr;
        return self;
    };
    
    this.recoil = function (target) {
        return self._getField(self.rawData, self.projectileStr, target);
    };
    
    this._fetch = function (callback, projectileBlob, queryData) { 
        if (self.limitInt && self.fetches++ == self.limitInt) {
            callback(projectileBlob, self);
            return;
        }
        
        queryData = queryData? queryData: {};
        
        var handle = function (data) {         
            self.rawData.push(data);
            var projectilePartial = self._getField([data], self.projectileStr);
            
            if (self._isArray(projectilePartial)) {
                if (!projectileBlob) {
                    projectileBlob = [];   
                }
                for (var p = 0; p<projectilePartial.length; p++) {
                    projectileBlob.push(projectilePartial[p]);   
                }
            }
            
            var reloaders = {};
            var hasReloader = false;
            
            for (var reloaderKey in self.reloaderStrs) {
                var reloader = self.reloaderStrs[reloaderKey];
                reloaders[reloaderKey] = self._getField([data], self.reloaderStrs[reloaderKey])[0];  
                hasReloader = reloaders[reloaderKey] || hasReloader;
            }
            
            if (hasReloader) {
                setTimeout(function () {
                    self._fetch(callback, projectileBlob, reloaders);
                }, self.delayInt);
            }else{
                callback(projectileBlob, self);
                return;
            }
        };
        
        this._getURL(self.url, queryData).then(handle);
    };
    
    this._getField = function (pools, fieldsStr, target) {
        var fields = fieldsStr.split('.');
        var targets = [];
        
        for (var f=0; f<fields.length; f++) {
            var field = fields[f];
            var newPools = [];
            
            for (var p=0; p<pools.length; p++) {
                var pool = pools[p];
                if (field == "*") {
                    var child;
                    if (self._isArray(pools)) {
                        for (child=0; child<pool.length; child++) {
                            newPools.push(pool[child]);
                            if (pool[child] == target) {
                                targets.push(pool);
                            }
                        }
                    }
                    else {
                        for (child in pool) {
                            newPools.push(pool[child]);
                            if (pool[child] == target) {
                                targets.push(pool);
                            }
                        }
                    }
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
    
    this._getURL = function (src, data) {
        var deferred = self._defer();
        var queryPairs = [];
        var queryString = "";
        
        for (var field in data) {
            queryPairs.push(field + "=" + data[field]);
        }
        
        if (queryPairs.length) {
            queryString = "?" + queryPairs.join("&");
        }
        
        function reqListener (res) {
            deferred.resolve(JSON.parse(res.responseText || res.currentTarget.responseText));
        }
        
        var xhr = new XMLHttpRequest();
        xhr.onload = reqListener;
        xhr.open("get", src + queryString, true);
        xhr.send(); 
        
        return deferred.promise;
    };
    
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

(new Cannon("http://api.reddit.com/user/abeisgreat/comments.json")).projectile("data.children.*.data.subreddit").delay(100).fire(function (projectile, cannon) {
    console.log("Caught projectile");
    
    console.log(projectile);
    
    var posts = cannon.recoil("PixelArt");
    for (var postIndex in posts) {
        var post = posts[postIndex];
        console.log(post.body);
    }
});